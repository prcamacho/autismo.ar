"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import {
  proposalInputSchema,
  proposalFromForm,
  isPublicHttpUrl,
} from "@/features/resources/validation";
import { checkFields, type ActionResult } from "./model";
import { findResources } from "@/features/resources/repository";

export async function findPossibleDuplicates(name: string) {
  const parsed = z.string().trim().min(3).max(160).safeParse(name);
  if (!parsed.success) return { status: "ready" as const, data: [] };
  const result = await findResources({ query: parsed.data });
  return {
    status: result.status,
    data: result.data
      .slice(0, 5)
      .map((r) => ({
        slug: r.slug,
        name: r.data.name,
        locality: r.data.locality,
        province: r.data.province,
      })),
  };
}

function databaseMessage(message: string) {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Ingresá a tu cuenta para continuar.",
    RATE_LIMIT:
      "Alcanzaste el límite de aportes por ahora. Volvé a intentar más tarde.",
    STALE_VERSION:
      "La ficha cambió desde que abriste este aporte. Abrí la versión actual y prepará una nueva corrección.",
    DUPLICATE_PROPOSAL:
      "Ya tenés un aporte igual pendiente. Podés verlo en Mi cuenta.",
    SELF_REVIEW: "La revisión tiene que hacerla otra persona.",
    NOT_REVIEWABLE: "Este aporte ya cambió de estado. Actualizá la página.",
    MODERATOR_REQUIRED: "Esta acción requiere un rol de moderación.",
    MISSING_CHECKS:
      "Falta corroborar alguno de los datos nuevos o modificados.",
    UNRESOLVED_DISAGREEMENT:
      "Hay datos en desacuerdo. Deben resolverse antes de publicar.",
    resources_identity:
      "Ya existe una ficha con ese nombre y ubicación. Rechazá el duplicado y proponé una corrección sobre la ficha existente.",
  };
  return (
    Object.entries(messages).find(([code]) => message.includes(code))?.[1] ||
    "No pudimos guardar el cambio. Revisá los datos e intentá nuevamente."
  );
}
async function perform(
  name: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const client = await createSupabaseClient();
  if (!client)
    return {
      message:
        "Los envíos todavía no están habilitados. Podés descargar un borrador.",
    };
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (!user || authError)
    return { message: "Ingresá a tu cuenta para continuar." };
  const { data, error } = await client.rpc(name, args);
  if (error) return { message: databaseMessage(error.message) };
  revalidatePath("/directorio", "layout");
  revalidatePath("/comunidad", "layout");
  revalidatePath("/cuenta");
  return {
    ok: true,
    id: typeof data === "string" ? data : undefined,
    message: "El cambio quedó guardado.",
  };
}

export async function submitProposal(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = proposalInputSchema.safeParse(proposalFromForm(form));
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message || "Revisá el formulario.",
    };
  const p = parsed.data;
  const result = await perform("community_submit", {
    p_data: p.resource,
    p_source: p.sourceUrl,
    p_note: p.note,
    p_resource: p.resourceId || null,
    p_version: p.baseVersion,
  });
  return result.ok
    ? {
        ...result,
        message: "Aporte enviado. Está en moderación y todavía no es público.",
      }
    : result;
}
const uuid = z.uuid();
const source = z.string().trim().max(1000).refine(isPublicHttpUrl);
export async function submitCheck(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({
      proposal: uuid,
      field: z.enum(Object.keys(checkFields) as [string, ...string[]]),
      verdict: z.enum(["matches", "disagrees"]),
      source,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || form.get("independent") !== "on")
    return {
      message:
        "Elegí un dato, indicá la fuente y confirmá que lo revisaste de forma independiente.",
    };
  const p = parsed.data;
  return perform("community_check", {
    p_proposal: p.proposal,
    p_field: p.field,
    p_verdict: p.verdict,
    p_source: p.source,
  });
}
export async function moderateProposal(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({
      proposal: uuid,
      decision: z.enum(["reviewing", "approved", "rejected"]),
      note: z.string().trim().min(10).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      message:
        "Elegí una decisión y explicá el motivo en al menos 10 caracteres.",
    };
  const p = parsed.data;
  return perform("community_moderate", {
    p_proposal: p.proposal,
    p_decision: p.decision,
    p_note: p.note,
  });
}
export async function reportResource(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({ resource: uuid, reason: z.string().trim().min(10).max(1000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Explicá el problema en al menos 10 caracteres." };
  const result = await perform("community_report", {
    p_resource: parsed.data.resource,
    p_reason: parsed.data.reason,
  });
  return result.ok
    ? {
        ok: true,
        message:
          "Reporte enviado a moderación. Podés seguir su estado en Mi cuenta.",
      }
    : result;
}
export async function resolveReport(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({ report: uuid, note: z.string().trim().min(10).max(1000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Explicá cómo se resolvió el reporte." };
  return perform("community_resolve_report", {
    p_report: parsed.data.report,
    p_note: parsed.data.note,
    p_hide: form.get("hide") === "on",
  });
}
