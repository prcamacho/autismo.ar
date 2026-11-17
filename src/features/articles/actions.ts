"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { articleDraftSchema, articleInputSchema } from "./validation";
import { ARTICLE_LIMITS } from "./model";
import { parseCafecitoEmbed } from "./cafecito";
import { mutateArticle, type ArticleActionResult } from "./mutation";

const identity = z.object({
  id: z.uuid(),
  revision: z.coerce.number().int().min(1),
});
const note = z.string().trim().min(10).max(1000);
const invalid = { message: "Revisá los datos e intentá nuevamente." };

export async function saveArticle(
  _: ArticleActionResult,
  form: FormData,
): Promise<ArticleActionResult> {
  const raw = form.get("content");
  const reference = z
    .object({
      id: z.union([z.uuid(), z.literal("")]),
      revision: z.coerce.number().int().min(0),
    })
    .safeParse({
      id: form.get("id") || "",
      revision: form.get("revision") || 0,
    });
  if (
    !reference.success ||
    typeof raw !== "string" ||
    new TextEncoder().encode(raw).length > ARTICLE_LIMITS.documentBytes
  )
    return invalid;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return invalid;
  }
  const parsed = articleDraftSchema.safeParse(value);
  if (!parsed.success)
    return {
      message:
        "Hay datos que necesitan corrección. Revisá los campos señalados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  const result = await mutateArticle(
    (client) =>
      client.rpc("article_save", {
        p_id: reference.data.id || null,
        p_data: parsed.data,
        p_revision: reference.data.revision,
      }),
    "Borrador guardado. Todavía no está enviado a revisión.",
  );
  // The RPC atomically increments the expected revision on success.
  return result.ok
    ? { ...result, revision: reference.data.revision + 1 }
    : result;
}

export async function submitArticle(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = identity.safeParse({
    id: form.get("id"),
    revision: form.get("revision"),
  });
  if (!parsed.success) return invalid;
  return mutateArticle(async (client, userId) => {
    const draft = await client
      .from("article_drafts")
      .select("data,author_id")
      .eq("id", parsed.data.id)
      .eq("author_id", userId)
      .maybeSingle();
    if (draft.error) return draft;
    if (!draft.data) return { error: { message: "NOT_OWNER" } };
    if (!articleInputSchema.safeParse(draft.data.data).success)
      return { error: { message: "INVALID_CONTENT" } };
    return client.rpc("article_submit", {
      p_article: parsed.data.id,
      p_revision: parsed.data.revision,
    });
  }, "Artículo enviado a revisión. Tu última versión publicada, si existe, sigue disponible.");
}

export async function withdrawArticle(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirm") !== "on")
    return { message: "Marcá la confirmación para retirar la publicación." };
  return mutateArticle(
    (client) => client.rpc("article_withdraw", { p_article: id.data }),
    "Publicación retirada. Conservás el borrador y el historial.",
  );
}

export async function restoreArticle(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = identity
    .extend({ version: z.coerce.number().int().min(1) })
    .safeParse({
      id: form.get("id"),
      revision: form.get("revision"),
      version: form.get("version"),
    });
  if (!parsed.success) return invalid;
  const result = await mutateArticle(async (client, userId) => {
    const owned = await client
      .from("article_drafts")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("author_id", userId)
      .maybeSingle();
    if (owned.error) return owned;
    if (!owned.data) return { error: { message: "NOT_OWNER" } };
    const historical = await client
      .from("article_revisions")
      .select("data")
      .eq("article_id", parsed.data.id)
      .eq("version", parsed.data.version)
      .maybeSingle();
    if (historical.error) return historical;
    if (!historical.data) return { error: { message: "NOT_FOUND" } };
    return client.rpc("article_save", {
      p_id: parsed.data.id,
      p_revision: parsed.data.revision,
      p_data: historical.data.data,
    });
  }, "Versión recuperada como borrador. Revisala y enviala a moderación para publicarla.");
  if (result.ok)
    redirect(
      `/cuenta/articulos/${parsed.data.id}?recuperada=${parsed.data.revision + 1}`,
    );
  return result;
}

export async function saveAuthorProfile(
  _: ArticleActionResult,
  form: FormData,
): Promise<ArticleActionResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      revision: z.coerce.number().int().min(0),
      embed: z.string().max(10000),
    })
    .safeParse({
      name: form.get("name"),
      revision: form.get("revision") || 0,
      embed: form.get("cafecito") || "",
    });
  if (!parsed.success)
    return {
      message:
        "Ingresá un nombre público de 2 a 80 caracteres y revisá el código de Cafecito.",
    };
  const cafecito = parsed.data.embed.trim()
    ? parseCafecitoEmbed(parsed.data.embed)
    : null;
  if (parsed.data.embed.trim() && !cafecito)
    return {
      message:
        "No reconocimos ese botón. Copiá el código oficial de Cafecito o el enlace completo a tu perfil.",
      fieldErrors: { cafecito: "Código o enlace de Cafecito no admitido." },
    };
  const result = await mutateArticle(
    (client) =>
      client.rpc("article_profile_save", {
        p_name: parsed.data.name,
        p_cafecito_slug: cafecito?.slug ?? null,
        p_revision: parsed.data.revision,
      }),
    "Perfil guardado. Un destino nuevo de Cafecito se mostrará después de su revisión.",
  );
  return result.ok ? { ...result, revision: parsed.data.revision + 1 } : result;
}

export async function reviewArticle(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = identity
    .extend({ decision: z.enum(["approved", "rejected"]), note })
    .safeParse({
      id: form.get("id"),
      revision: form.get("revision"),
      decision: form.get("decision"),
      note: form.get("note"),
    });
  if (!parsed.success)
    return {
      message:
        "Elegí una decisión y explicá el motivo con al menos 10 caracteres.",
    };
  return mutateArticle(
    (client) =>
      client.rpc("article_moderate", {
        p_article: parsed.data.id,
        p_revision: parsed.data.revision,
        p_decision: parsed.data.decision,
        p_note: parsed.data.note,
      }),
    "Decisión registrada.",
  );
}

export async function reviewCafecito(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = identity
    .extend({ decision: z.enum(["approved", "rejected"]), note })
    .safeParse({
      id: form.get("id"),
      revision: form.get("revision"),
      decision: form.get("decision"),
      note: form.get("note"),
    });
  if (!parsed.success) return invalid;
  return mutateArticle(
    (client) =>
      client.rpc("article_profile_moderate", {
        p_profile: parsed.data.id,
        p_revision: parsed.data.revision,
        p_approved: parsed.data.decision === "approved",
        p_note: parsed.data.note,
      }),
    "Revisión del enlace de Cafecito registrada.",
  );
}

export async function reportArticle(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({ id: z.uuid(), reason: note })
    .safeParse({ id: form.get("id"), reason: form.get("reason") });
  if (!parsed.success)
    return { message: "Explicá el problema con entre 10 y 1000 caracteres." };
  return mutateArticle(
    (client) =>
      client.rpc("article_report", {
        p_article: parsed.data.id,
        p_reason: parsed.data.reason,
      }),
    "Reporte enviado. Podés seguir su estado en Mis artículos.",
  );
}

export async function resolveArticleReport(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({ id: z.uuid(), note })
    .safeParse({ id: form.get("id"), note: form.get("note") });
  if (!parsed.success) return invalid;
  return mutateArticle(
    (client) =>
      client.rpc("article_resolve_report", {
        p_report: parsed.data.id,
        p_note: parsed.data.note,
        p_hide: form.get("hide") === "on",
      }),
    "Reporte resuelto.",
  );
}
