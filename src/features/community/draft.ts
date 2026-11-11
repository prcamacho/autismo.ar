import {
  proposalFromForm,
  proposalInputSchema,
} from "@/features/resources/validation";

export const DRAFT_MAX_BYTES = 30000;
const format = "autismo.ar/proposal-v1";

export function serializeDraft(form: FormData) {
  const parsed = proposalInputSchema.safeParse(proposalFromForm(form));
  if (!parsed.success)
    throw new Error(
      parsed.error.issues[0]?.message || "Completá los campos obligatorios.",
    );
  return JSON.stringify({ format, ...parsed.data }, null, 2);
}

export function parseDraft(text: string, resourceId: string, version: number) {
  if (new TextEncoder().encode(text).length > DRAFT_MAX_BYTES) {
    throw new Error("El archivo es demasiado grande para ser un borrador.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      "No pudimos leer este borrador. Usá un archivo descargado desde este formulario.",
    );
  }
  const parsed = proposalInputSchema.safeParse(raw);
  if (
    !raw ||
    typeof raw !== "object" ||
    !("format" in raw) ||
    raw.format !== format ||
    !parsed.success
  ) {
    throw new Error(
      "No pudimos leer este borrador. Usá un archivo descargado desde este formulario.",
    );
  }
  if (
    parsed.data.resourceId !== resourceId ||
    parsed.data.baseVersion !== version
  ) {
    throw new Error(
      "Este borrador pertenece a otra ficha o versión. Abrí la ficha correspondiente; si cambió, prepará una corrección sobre la versión actual.",
    );
  }
  return parsed.data;
}
