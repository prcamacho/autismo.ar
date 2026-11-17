import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/result";
import { getArticleStatus } from "./config";

type Client = NonNullable<Awaited<ReturnType<typeof createSupabaseClient>>>;
export type ArticleActionResult = ActionResult & {
  revision?: number;
  fieldErrors?: Record<string, string>;
};

const failures: Record<string, string> = {
  AUTH_REQUIRED: "Ingresá a tu cuenta para continuar.",
  STALE_VERSION:
    "Hay una versión más reciente. Conservá tu borrador, recargá la página y revisá los cambios antes de guardar.",
  RATE_LIMIT:
    "Alcanzaste el límite temporal de cambios. Conservá tu borrador y volvé a intentar más tarde.",
  PROFILE_REQUIRED:
    "Completá tu perfil de autor antes de enviar el artículo a revisión.",
  NOT_FOUND:
    "El contenido ya no está disponible o no tenés permiso para modificarlo.",
  NOT_OWNER: "Solo el autor puede modificar este borrador.",
  FORBIDDEN: "Tu cuenta no tiene permiso para realizar ese cambio.",
  SELF_REVIEW:
    "Otra persona debe revisar tu publicación o tu enlace de Cafecito.",
  MODERATOR_REQUIRED: "Esta acción requiere permisos de moderación.",
  NOT_REVIEWABLE:
    "El contenido ya cambió de estado. Recargá antes de revisarlo.",
  INVALID_CONTENT:
    "Revisá el contenido, las fechas y las fuentes antes de continuar.",
  INVALID_INPUT: "Revisá los datos ingresados antes de continuar.",
  INVALID_PROFILE: "Revisá el nombre público y el destino de Cafecito.",
  INVALID_ARTICLE:
    "El borrador contiene datos no admitidos. Revisá sus campos y enlaces.",
  INCOMPLETE_ARTICLE:
    "Completá el título y el contenido. Las agendas necesitan fechas y una fuente antes de enviarse.",
  INVALID_DECISION:
    "Elegí una decisión y explicá el motivo con entre 10 y 1000 caracteres.",
  INVALID_REPORT: "Revisá el artículo y la descripción del problema.",
  DUPLICATE_REPORT: "Ya hay un reporte tuyo pendiente para este artículo.",
};

export async function mutateArticle(
  run: (
    client: Client,
    userId: string,
  ) => PromiseLike<{
    data?: unknown;
    error: { message: string; code?: string } | null;
  }>,
  success: string,
): Promise<ArticleActionResult> {
  if (getArticleStatus() !== "ready")
    return {
      message:
        "Los envíos de artículos no están disponibles. Conservá tu borrador y volvé a intentar más tarde.",
    };
  try {
    const client = await createSupabaseClient();
    if (!client)
      return { message: "No pudimos conectar. Conservá tu borrador." };
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) return { message: failures.AUTH_REQUIRED };
    const result = await run(client, user.id);
    if (result.error) {
      const expected = Object.entries(failures).find(([code]) =>
        result.error?.message.includes(code),
      );
      if (!expected)
        console.error("articles.write.failed", { code: result.error.code });
      return {
        message:
          expected?.[1] ||
          "No pudimos completar el cambio. Conservá tu borrador y revisá el estado antes de reintentar.",
      };
    }
    for (const path of [
      "/articulos",
      "/cuenta/articulos",
      "/cuenta/perfil-autor",
      "/comunidad/revisar/articulos",
    ])
      revalidatePath(path, "layout");
    return {
      ok: true,
      message: success,
      ...(typeof result.data === "string" ? { id: result.data } : {}),
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("articles.write.unavailable");
    return {
      message:
        "Se interrumpió la conexión. Conservá el borrador y comprobá si el cambio se guardó antes de reintentar.",
    };
  }
}
