"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/result";
import { getPlaces } from "@/features/locations/catalog";
import type { ExchangeFunctions } from "./db-contract";
import { exchangeClient, recordExchangeFailure } from "./server";
import { getOwnProfile } from "./repository";
import {
  fromListingForm,
  fromProfileForm,
  listingSchema,
  profileSchema,
  uuidSchema,
  contactSchema,
  messageSchema,
} from "./validation";
import { removeProfilePhoto, uploadProfilePhoto } from "./photos";

const errors: Record<string, string> = {
  AUTH_REQUIRED: "Ingresá a tu cuenta para continuar.",
  ADULT_REQUIRED: "Confirmá que sos mayor de 18 años antes de participar.",
  ACCOUNT_DELETING: "Tu cuenta tiene una solicitud de eliminación en curso.",
  RATE_LIMIT: "Alcanzaste el límite por ahora. Volvé a intentar más tarde.",
  STALE_VERSION:
    "La publicación cambió. Actualizá la página antes de volver a guardar.",
  PROFILE_REQUIRED: "Completá primero tu perfil profesional.",
  PROFILE_REVIEW_REQUIRED:
    "El perfil profesional necesita revisión antes de publicar la disponibilidad.",
  NOT_FOUND:
    "Este contenido no está disponible o no tenés permiso para acceder.",
  FORBIDDEN: "No tenés permiso para realizar esta acción.",
  MODERATOR_REQUIRED: "Esta acción requiere permisos de moderación.",
  SELF_REVIEW: "Otra persona tiene que revisar tu publicación.",
  SELF_CONTACT: "No podés solicitar contacto con tu propia publicación.",
  LISTING_UNAVAILABLE:
    "Esta publicación ya no recibe solicitudes. Actualizá la página.",
  CONTACT_DISABLED: "Esta publicación no recibe solicitudes de contacto.",
  CONTACT_EXISTS:
    "Ya enviaste una solicitud para esta publicación. Consultá tu bandeja.",
  CONTACT_BLOCKED: "El contacto está bloqueado y no admite mensajes.",
  CONTACT_NOT_ACCEPTED:
    "La otra persona debe aceptar la solicitud antes de conversar.",
  CONTACT_NOT_PENDING: "La solicitud ya fue respondida. Actualizá tu bandeja.",
  REVIEW_REQUIRED:
    "La publicación necesita revisión antes de cambiar su estado.",
  REPORT_RESOLVED: "El reporte ya fue resuelto. Actualizá la página.",
  INVALID_INPUT: "Revisá los datos antes de volver a enviar.",
  INVALID_PHOTO: "La foto no pertenece al perfil. Volvé a cargarla.",
  INVALID_LOCATION: "Revisá las ubicaciones seleccionadas.",
  PHOTO_SIZE:
    "La foto debe pesar hasta 2 MB. Probá con una imagen más pequeña.",
  PHOTO_FORMAT: "Elegí una foto JPG, PNG o WebP estática.",
  PHOTO_UNAVAILABLE:
    "No pudimos guardar la foto. Podés volver a intentar o guardar sin foto.",
  NONCE_REUSED:
    "Ese envío ya se procesó con otro contenido. Abrí el resultado antes de enviar una nueva versión.",
};
function messageFor(message: string) {
  return (
    Object.entries(errors).find(([code]) => message.includes(code))?.[1] ??
    "No pudimos guardar el cambio. Conservá el contenido y volvé a intentar."
  );
}
type WriteName = Exclude<
  keyof ExchangeFunctions,
  | "exchange_search"
  | "exchange_profile"
  | "exchange_listing"
  | "exchange_photo_access"
  | "exchange_maintenance"
  | "exchange_claim_notifications"
  | "exchange_finish_notification"
>;
type WriteCall = {
  [Name in WriteName]: [Name, ExchangeFunctions[Name]["Args"]];
}[WriteName];
async function perform(...[name, args]: WriteCall): Promise<ActionResult> {
  try {
    const client = await exchangeClient();
    if (!client)
      return {
        message:
          "Las publicaciones y el contacto todavía no están habilitados en este entorno.",
      };
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) return { message: errors.AUTH_REQUIRED };
    const result = await client.rpc(name, args);
    if (result.error) {
      recordExchangeFailure(name, result.error.code);
      return { message: messageFor(result.error.message) };
    }
    for (const path of ["/busquedas", "/profesionales", "/mensajes"])
      revalidatePath(path, "layout");
    return {
      ok: true,
      id: typeof result.data === "string" ? result.data : undefined,
      message: "El cambio quedó guardado.",
    };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure(name);
    return {
      message:
        "No pudimos confirmar el cambio. Actualizá el estado antes de reintentar; tu texto se conserva en el formulario.",
    };
  }
}
const version = z.coerce.number().int().min(0).max(2147483647);
const invalid = (
  message = "Revisá los datos del formulario.",
): ActionResult => ({ message });

export async function enrollAccount(_: ActionResult, form: FormData) {
  if (form.get("adult") !== "on")
    return invalid(
      "Para publicar y contactar en este piloto tenés que confirmar que sos mayor de 18 años.",
    );
  return perform("exchange_enroll", {
    p_adult: true,
    p_notifications: form.get("notifications") === "on",
  });
}
export async function saveProfile(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    return await saveProfileInput(form);
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("save_profile");
    return invalid(
      "No pudimos confirmar el guardado. Conservá el texto y consultá el estado antes de reintentar.",
    );
  }
}
async function saveProfileInput(form: FormData): Promise<ActionResult> {
  const client = await exchangeClient();
  if (!client)
    return invalid("El perfil todavía no se puede guardar en este entorno.");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return invalid(errors.AUTH_REQUIRED);
  const current = await getOwnProfile();
  if (current.status !== "ready")
    return invalid("No pudimos consultar tu perfil. Volvé a intentar.");
  const parsedVersion = version.safeParse(form.get("version"));
  if (!parsedVersion.success) return invalid();
  if (parsedVersion.data !== (current.data?.version ?? 0))
    return invalid(errors.STALE_VERSION);
  const oldPhoto = current.data?.data.photoPath ?? null;
  const photoPath = form.get("removePhoto") === "on" ? null : oldPhoto;
  const parsed = profileSchema.safeParse(fromProfileForm(form, photoPath));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  try {
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      const enrollment = await client
        .from("exchange_accounts")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (enrollment.error || !enrollment.data)
        return invalid(errors.ADULT_REQUIRED);
      const reservation = await client.rpc("exchange_reserve_photo", {});
      if (reservation.error)
        return invalid(messageFor(reservation.error.message));
      const uploaded = await uploadProfilePhoto(photo, user.id);
      parsed.data.photoPath = uploaded;
    }
    const result = await perform("exchange_save_profile", {
      p_data: parsed.data,
      p_public: form.get("isPublic") === "on",
      p_version: parsedVersion.data,
    });
    if (result.ok) {
      if (oldPhoto !== parsed.data.photoPath)
        await removeProfilePhoto(oldPhoto);
      return {
        ...result,
        message:
          "Perfil guardado. Los cambios de presentación quedan sujetos a revisión.",
      };
    }
    // An uncertain response can precede a delayed commit. Keep the tracked upload
    // for delayed garbage collection; an immediate read cannot rule that commit out.
    return result;
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("profile_photo");
    return invalid(
      messageFor(error instanceof Error ? error.message : "PHOTO_UNAVAILABLE"),
    );
  }
}
export async function saveListing(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const data = listingSchema.safeParse(fromListingForm(form));
  const fields = z
    .object({
      id: z.union([uuidSchema, z.literal("")]),
      nonce: uuidSchema,
      kind: z.enum(["offer", "request"]),
      version,
    })
    .safeParse({
      id: form.get("id") ?? "",
      nonce: form.get("nonce"),
      kind: form.get("kind"),
      version: form.get("version"),
    });
  if (!data.success) return invalid(data.error.issues[0]?.message);
  if (!fields.success) return invalid();
  try {
    getPlaces(data.data.locationIds);
  } catch {
    return invalid(errors.INVALID_LOCATION);
  }
  const result = await perform("exchange_save_listing", {
    p_id: fields.data.id || null,
    p_nonce: fields.data.nonce,
    p_kind: fields.data.kind,
    p_data: data.data,
    p_version: fields.data.version,
  });
  return result.ok
    ? {
        ...result,
        message:
          "Publicación guardada. Consultá su estado en Mis publicaciones.",
      }
    : result;
}
export async function changeListingState(_: ActionResult, form: FormData) {
  const parsed = z
    .object({
      id: uuidSchema,
      state: z.enum(["renew", "paused", "closed", "delete"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid();
  return perform("exchange_listing_state", {
    p_id: parsed.data.id,
    p_state: parsed.data.state,
  });
}
export async function moderateEntry(_: ActionResult, form: FormData) {
  const parsed = z
    .object({
      kind: z.enum(["profile", "listing"]),
      id: uuidSchema,
      version,
      decision: z.enum(["approved", "rejected"]),
      note: z.string().trim().min(10).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return invalid(
      "Elegí una decisión y explicá el motivo en al menos 10 caracteres.",
    );
  return perform("exchange_moderate", {
    p_kind: parsed.data.kind,
    p_id: parsed.data.id,
    p_version: parsed.data.version,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
}
export async function requestContact(_: ActionResult, form: FormData) {
  const parsed = contactSchema.safeParse({
    id: form.get("listing"),
    body: form.get("body"),
    nonce: form.get("nonce"),
  });
  if (!parsed.success)
    return invalid("Escribí una presentación de hasta 800 caracteres.");
  const result = await perform("exchange_request", {
    p_listing: parsed.data.id,
    p_body: parsed.data.body,
    p_nonce: parsed.data.nonce,
  });
  return result.ok
    ? {
        ...result,
        message: "Solicitud guardada. Podés seguirla desde tu bandeja.",
      }
    : result;
}
export async function respondContact(_: ActionResult, form: FormData) {
  const parsed = z
    .object({ id: uuidSchema, decision: z.enum(["accepted", "rejected"]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid();
  return perform("exchange_respond", {
    p_id: parsed.data.id,
    p_decision: parsed.data.decision,
  });
}
export async function sendMessage(_: ActionResult, form: FormData) {
  const parsed = messageSchema.safeParse({
    id: form.get("conversation"),
    body: form.get("body"),
    nonce: form.get("nonce"),
  });
  if (!parsed.success)
    return invalid("Escribí un mensaje de hasta 2000 caracteres.");
  const result = await perform("exchange_send", {
    p_conversation: parsed.data.id,
    p_body: parsed.data.body,
    p_nonce: parsed.data.nonce,
  });
  return result.ok
    ? { ...result, message: "Mensaje guardado en la conversación." }
    : result;
}
export async function blockContact(_: ActionResult, form: FormData) {
  const id = uuidSchema.safeParse(form.get("id"));
  if (!id.success) return invalid();
  return perform("exchange_block", { p_conversation: id.data });
}
export async function reportEntry(_: ActionResult, form: FormData) {
  const parsed = z
    .object({
      kind: z.enum(["profile", "listing", "conversation"]),
      id: uuidSchema,
      reason: z.string().trim().min(10).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return invalid(
      "Explicá el problema en entre 10 y 1000 caracteres, sin agregar datos sensibles.",
    );
  return perform("exchange_report", {
    p_kind: parsed.data.kind,
    p_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });
}
export async function resolveReport(_: ActionResult, form: FormData) {
  const parsed = z
    .object({ id: uuidSchema, note: z.string().trim().min(10).max(1000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return invalid("Explicá cómo se resolvió el reporte.");
  return perform("exchange_resolve_report", {
    p_id: parsed.data.id,
    p_note: parsed.data.note,
    p_hide: form.get("hide") === "on",
  });
}
export async function deleteExchangeAccount(_: ActionResult, form: FormData) {
  if (form.get("confirmation") !== "ELIMINAR MI CUENTA")
    return invalid("Escribí ELIMINAR MI CUENTA para confirmar.");
  const result = await perform("exchange_delete_account", {});
  return result.ok
    ? {
        ...result,
        message:
          "Tus publicaciones de búsquedas se retiraron. La eliminación de la cuenta y sus demás contenidos quedó solicitada; todavía no está completada.",
      }
    : result;
}
