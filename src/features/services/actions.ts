"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { isPublicHttpUrl } from "@/lib/public-url";
import {
  exchangeClient,
  recordExchangeFailure,
} from "@/features/exchanges/server";
import { SERVICE_GROUPS } from "./model";

const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (value) =>
        !/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|www\.|(?:\+?\d[\s().-]*){8,})/i.test(
          value,
        ),
      "Quitá datos de contacto del texto.",
    );
const source = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isPublicHttpUrl(value),
    "Usá un enlace público válido.",
  );
const requestSchema = z.object({
  name: text(2, 100),
  reason: text(10, 1000),
  source,
  nonce: z.uuid(),
});
function failure(message?: string): ActionResult {
  const errors: Record<string, string> = {
    AUTH_REQUIRED: "Ingresá a tu cuenta para continuar.",
    ADULT_REQUIRED: "Habilitá tu participación antes de enviar.",
    RATE_LIMIT: "Llegaste al límite de solicitudes. Volvé a intentar mañana.",
    SELF_REVIEW: "Otra persona debe revisar esta solicitud.",
    MODERATOR_REQUIRED: "Necesitás permisos de moderación.",
    STALE_VERSION: "La solicitud ya fue revisada. Actualizá la página.",
    SOURCE_REQUIRED: "Agregá una fuente para incorporar la opción.",
    INVALID_SERVICE: "Elegí un servicio válido.",
    NONCE_REUSED:
      "Este envío ya se procesó con otro contenido. Consultá tus solicitudes.",
    ACCOUNT_DELETING: "Tu cuenta tiene una solicitud de eliminación en curso.",
  };
  return {
    message:
      Object.entries(errors).find(([code]) => message?.includes(code))?.[1] ??
      "No pudimos guardar. Revisá los datos y volvé a intentar; el formulario conserva tu texto.",
  };
}
export async function requestService(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = requestSchema.safeParse({
    name: form.get("requestedName"),
    reason: form.get("reason"),
    source: form.get("source") ?? "",
    nonce: form.get("nonce"),
  });
  if (!parsed.success)
    return {
      message:
        "Completá el nombre y una explicación de al menos 10 caracteres, sin datos personales.",
    };
  let draft: Record<string, unknown> | null = null;
  if (form.get("withDraft") === "on") {
    // Only fields from the listing form, never credentials, account IDs or routing destinations.
    draft = Object.fromEntries(
      [
        "kind",
        "service",
        "role",
        "description",
        "modality",
        "startDate",
        "availability",
        "engagement",
        "coverage",
      ].map((key) => [key, String(form.get(key) ?? "").slice(0, 1500)]),
    );
    for (const key of ["days", "shifts", "ageGroups", "locationIds"])
      draft[key] = form
        .getAll(key)
        .filter((x) => typeof x === "string")
        .slice(0, 30);
    draft.receiveRequests = form.get("receiveRequests") === "on";
  }
  try {
    const client = await exchangeClient();
    if (!client) return failure();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return failure("AUTH_REQUIRED");
    const { data, error } = await client.rpc("catalog_request", {
      p_name: parsed.data.name,
      p_reason: parsed.data.reason,
      p_source: parsed.data.source,
      p_nonce: parsed.data.nonce,
      p_draft: draft,
    });
    if (error) {
      recordExchangeFailure("catalog_request", error.code);
      return failure(error.message);
    }
    revalidatePath("/catalogo/solicitudes");
    return {
      ok: true,
      id: data,
      href: "/catalogo/solicitudes",
      message: draft
        ? "Solicitud enviada y borrador privado guardado. Podés seguirlos en Mis solicitudes."
        : "Solicitud enviada a revisión. Consultá la respuesta en Mis solicitudes.",
    };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("catalog_request");
    return failure();
  }
}

export async function reviewService(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({
      id: z.uuid(),
      decision: z.enum(["existing", "alias", "new", "rejected"]),
      service: z.string().max(60),
      name: z.string().trim().max(100),
      group: z.enum(SERVICE_GROUPS),
      source,
      note: text(10, 1000),
    })
    .safeParse({
      id: form.get("id"),
      decision: form.get("decision"),
      service: form.get("service") ?? "",
      name: form.get("name") ?? "",
      group: form.get("group"),
      source: form.get("source") ?? "",
      note: form.get("note"),
    });
  if (!parsed.success) return failure("INVALID_INPUT");
  try {
    const client = await exchangeClient();
    if (!client) return failure();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return failure("AUTH_REQUIRED");
    const d = parsed.data;
    const { error } = await client.rpc("catalog_review", {
      p_request: d.id,
      p_decision: d.decision,
      p_service: d.service,
      p_name: d.name,
      p_group: d.group,
      p_source: d.source,
      p_note: d.note,
    });
    if (error) {
      recordExchangeFailure("catalog_review", error.code);
      return failure(error.message);
    }
    for (const path of ["/catalogo", "/busquedas", "/directorio"])
      revalidatePath(path, "layout");
    revalidatePath("/");
    return {
      ok: true,
      message:
        "Revisión guardada. El catálogo y la respuesta ya están actualizados.",
    };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("catalog_review");
    return failure();
  }
}
