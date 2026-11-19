import { z } from "zod";
import { AGE_GROUPS, DAYS, EXCHANGE_LIMITS, SHIFTS } from "./model";
import { ENGAGEMENTS, COVERAGES } from "@/features/services/model";

const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Completá al menos ${min} caracteres.`)
    .max(max, `Usá hasta ${max} caracteres.`);
const noPublicContact = (value: string) =>
  !/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|www\.|(?:\+?\d[\s().-]*){8,})/i.test(
    value,
  );
const publicText = (min: number, max: number) =>
  text(min, max).refine(
    noPublicContact,
    "Usá el contacto privado: quitá teléfonos, correos y enlaces de este texto.",
  );
const unique = <T extends readonly [string, ...string[]]>(
  values: T,
  max: number,
) =>
  z
    .array(z.enum(values))
    .max(max)
    .refine(
      (items) => new Set(items).size === items.length,
      "Hay opciones repetidas.",
    );
export const uuidSchema = z.uuid();
export const profileSchema = z.strictObject({
  name: publicText(2, 100),
  title: publicText(2, 160),
  institution: publicText(0, 160),
  graduationYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getUTCFullYear())
    .nullable(),
  registration: text(0, 120),
  experienceYears: z.number().int().min(0).max(80),
  description: publicText(20, 1500),
  ageGroups: unique(AGE_GROUPS, 4),
  photoPath: z
    .string()
    .regex(/^[\da-f-]{36}\/[\da-f-]{36}\.webp$/i)
    .nullable(),
});
export const listingSchema = z.strictObject({
  title: publicText(5, 120),
  service: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,59}$/, "Elegí un servicio de la lista."),
  role: publicText(2, 120),
  description: publicText(0, 1500),
  modality: z.enum(["presencial", "virtual", "mixta"]),
  days: unique(DAYS, 7).min(1, "Elegí al menos un día."),
  shifts: unique(SHIFTS, 3).min(1, "Elegí al menos un turno."),
  startDate: z.union([z.literal(""), z.iso.date()]),
  availability: z.enum(["available", "limited", "unavailable"]),
  engagement: z.enum(ENGAGEMENTS),
  coverage: z.enum(COVERAGES).optional(),
  ageGroups: unique(AGE_GROUPS, 4),
  locationIds: z
    .array(text(1, 80))
    .min(1, "Agregá al menos una ubicación.")
    .max(EXCHANGE_LIMITS.locations)
    .refine(
      (ids) => ids.length === new Set(ids).size,
      "Quitá las ubicaciones repetidas.",
    ),
  receiveRequests: z.boolean(),
});
export function fromProfileForm(form: FormData, photoPath: string | null) {
  return {
    name: form.get("name"),
    title: form.get("title"),
    institution: form.get("institution") ?? "",
    graduationYear: form.get("graduationYear")
      ? Number(form.get("graduationYear"))
      : null,
    registration: form.get("registration") ?? "",
    experienceYears: Number(form.get("experienceYears")),
    description: form.get("description"),
    ageGroups: form.getAll("ageGroups"),
    photoPath,
  };
}
export function fromListingForm(form: FormData) {
  return {
    title: "Publicación de servicio",
    service: form.get("service"),
    role: form.get("role"),
    description: form.get("description"),
    modality: form.get("modality"),
    days: form.getAll("days"),
    shifts: form.getAll("shifts"),
    startDate: form.get("startDate") ?? "",
    availability: form.get("availability") ?? "available",
    engagement: form.get("engagement") ?? "",
    coverage: form.get("coverage") ?? "",
    ageGroups: form.getAll("ageGroups"),
    locationIds: form.getAll("locationIds"),
    receiveRequests: form.get("receiveRequests") === "on",
  };
}
export const contactSchema = z.object({
  id: uuidSchema,
  body: text(1, EXCHANGE_LIMITS.introduction),
  nonce: uuidSchema,
});
export const messageSchema = z.object({
  id: uuidSchema,
  body: text(1, EXCHANGE_LIMITS.message),
  nonce: uuidSchema,
});
