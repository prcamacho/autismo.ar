import { z } from "zod";
import { categories } from "@/lib/catalog";
import { getProvinceName } from "@/lib/geography";

export const ageGroups = ["Infancia", "Adolescencia", "Adultez"] as const;
export function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]+)?([/?#][^\s]*)?$/.test(
        value,
      )
    );
  } catch {
    return false;
  }
}
const url = z
  .string()
  .trim()
  .max(1000)
  .refine(isPublicHttpUrl, "Usá un enlace http o https sin credenciales.");
const optionalUrl = z.union([url, z.literal("")]).default("");
export const resourceInputSchema = z
  .object({
    name: z.string().trim().min(3, "Escribí al menos 3 caracteres.").max(160),
    description: z
      .string()
      .trim()
      .min(30, "Contá qué ofrece en al menos 30 caracteres.")
      .max(2000),
    categoryIds: z
      .array(
        z
          .string()
          .refine(
            (v) => categories.some((c) => c.id === v),
            "Categoría no reconocida.",
          ),
      )
      .min(1, "Elegí una categoría.")
      .max(6),
    scope: z.enum(["national", "province", "local"]),
    province: z.string().default(""),
    locality: z.string().trim().max(120).default(""),
    website: optionalUrl,
    phone: z.string().trim().max(80).default(""),
    hours: z.string().trim().max(300).default(""),
    coverage: z.string().trim().max(400).default(""),
    ageGroups: z.array(z.enum(ageGroups)).max(3).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.scope !== "national" && !getProvinceName(data.province))
      ctx.addIssue({
        code: "custom",
        path: ["province"],
        message: "Elegí una provincia válida.",
      });
    if (data.scope === "local" && data.locality.length < 2)
      ctx.addIssue({
        code: "custom",
        path: ["locality"],
        message: "Indicá la localidad.",
      });
  })
  .transform((data) => ({
    ...data,
    categoryIds: [...new Set(data.categoryIds)],
    ageGroups: [...new Set(data.ageGroups)],
    province: data.scope === "national" ? "" : data.province,
    locality: data.scope === "local" ? data.locality : "",
  }));
export type ResourceInput = z.output<typeof resourceInputSchema>;
export const proposalInputSchema = z
  .object({
    resource: resourceInputSchema,
    resourceId: z.union([z.uuid(), z.literal("")]),
    baseVersion: z.number().int().min(0),
    sourceUrl: url,
    note: z
      .string()
      .trim()
      .min(10, "Explicá de dónde sale el dato o qué querés corregir.")
      .max(1000),
    consent: z.literal(true, {
      error: "Confirmá que compartís información pública del recurso.",
    }),
  })
  .superRefine((data, ctx) => {
    if (
      (data.resourceId && data.baseVersion < 1) ||
      (!data.resourceId && data.baseVersion !== 0)
    )
      ctx.addIssue({
        code: "custom",
        path: ["resourceId"],
        message: "Volvé a abrir la ficha para proponer una corrección.",
      });
  });
export function proposalFromForm(form: FormData) {
  return {
    resource: Object.assign(Object.fromEntries(form), {
      categoryIds: form.getAll("categoryIds"),
      ageGroups: form.getAll("ageGroups"),
    }),
    resourceId: String(form.get("resourceId") || ""),
    baseVersion: Number(form.get("baseVersion") || 0),
    sourceUrl: String(form.get("sourceUrl") || ""),
    note: String(form.get("note") || ""),
    consent: form.get("consent") === "on",
  };
}
