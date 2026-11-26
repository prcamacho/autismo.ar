import { z } from "zod";
import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";
import { isPublicHttpUrl } from "@/lib/public-url";
import { isCalendarDate } from "./content";
import { youtubeVideoId } from "./youtube";
import { ARTICLE_LIMITS as L, type ArticleInput } from "./model";

const text = (limit: number) => z.string().trim().max(limit);
const date = z
  .string()
  .refine((v) => v === "" || isCalendarDate(v), "Revisá la fecha.");
const url = text(L.url).refine(
  (v) => v === "" || isPublicHttpUrl(v),
  "Ingresá un enlace HTTP o HTTPS válido.",
);
const source = z.strictObject({ label: text(L.linkLabel), url });
const textBlock = <T extends "paragraph" | "heading" | "callout">(type: T) =>
  z.strictObject({ type: z.literal(type), text: text(L.text) });

export const articleBlockSchema = z.discriminatedUnion("type", [
  textBlock("paragraph"),
  textBlock("heading"),
  textBlock("callout"),
  z.strictObject({
    type: z.literal("list"),
    items: z.array(text(L.listItem)).max(L.listItems),
  }),
  z.strictObject({ type: z.literal("link"), label: text(L.linkLabel), url }),
  z.strictObject({
    type: z.literal("youtube"),
    label: text(L.linkLabel),
    url: text(L.url).refine(
      (value) => value === "" || youtubeVideoId(value) !== null,
      "Ingresá un enlace HTTPS a un video de YouTube, no a un canal o una lista.",
    ),
    display: z.enum(["link", "embed"]),
  }),
  z
    .strictObject({
      type: z.literal("table"),
      headers: z.array(text(L.tableHeader)).max(L.tableColumns),
      rows: z
        .array(z.array(text(L.tableCell)).max(L.tableColumns))
        .max(L.tableRows),
    })
    .refine(
      (v) => v.rows.every((row) => row.length === v.headers.length),
      "Todas las filas deben tener la misma cantidad de columnas.",
    ),
]);

export const articleDraftSchema = z
  .strictObject({
    title: text(L.title),
    summary: text(L.summary),
    kind: z.enum(["article", "agenda"]),
    category: z
      .string()
      .refine(
        (v) => v === "" || categories.some((c) => c.id === v),
        "Elegí una categoría válida.",
      ),
    province: z
      .string()
      .refine(
        (v) => v === "" || PROVINCES.some((p) => p.id === v),
        "Elegí una provincia válida.",
      ),
    locality: text(L.locality),
    expiresOn: date,
    theme: z.enum(["blue", "teal", "violet"]),
    headingStyle: z.enum(["plain", "band"]),
    showCafecito: z.boolean(),
    blocks: z.array(articleBlockSchema).max(L.blocks),
    agenda: z
      .array(
        z.strictObject({
          date,
          title: text(L.agendaTitle),
          details: text(L.agendaDetails),
          kind: z.enum(["request", "appointment", "activity"]),
        }),
      )
      .max(L.agendaRows),
    sources: z.array(source).max(L.sources),
  })
  .superRefine((value, context) => {
    if (value.locality && !value.province)
      context.addIssue({
        code: "custom",
        path: ["province"],
        message: "Elegí la provincia de esta localidad.",
      });
    if (
      new TextEncoder().encode(JSON.stringify(value)).byteLength >
      L.documentBytes
    )
      context.addIssue({
        code: "custom",
        message: "El artículo es demasiado extenso. Reducí el contenido.",
      });
  });

export const articleInputSchema = articleDraftSchema.superRefine(
  (value, context) => {
    const required = (
      condition: boolean,
      path: (string | number)[],
      message: string,
    ) => {
      if (!condition) context.addIssue({ code: "custom", path, message });
    };
    required(
      value.title.length >= 5,
      ["title"],
      "Escribí un título de al menos 5 caracteres.",
    );
    required(
      value.kind !== "article" || value.blocks.length > 0,
      ["blocks"],
      "Agregá contenido al artículo.",
    );
    required(
      value.kind !== "agenda" || value.agenda.length > 0,
      ["agenda"],
      "Agregá al menos una fecha.",
    );
    required(
      value.kind !== "agenda" || value.sources.length > 0,
      ["sources"],
      "Agregá la fuente de esta agenda.",
    );
    value.blocks.forEach((block, index) => {
      const path = ["blocks", index];
      switch (block.type) {
        case "paragraph":
        case "heading":
        case "callout":
          required(
            Boolean(block.text),
            [...path, "text"],
            "Completá el texto o quitá este bloque.",
          );
          break;
        case "link":
        case "youtube":
          required(
            Boolean(block.label && block.url),
            path,
            "Completá el texto y el destino del enlace.",
          );
          break;
        case "list":
          required(
            block.items.length > 0 && block.items.every(Boolean),
            path,
            "Completá los elementos de la lista.",
          );
          break;
        case "table":
          required(
            block.headers.length > 0 &&
              block.rows.length > 0 &&
              block.headers.every(Boolean) &&
              block.rows.every((row) => row.every(Boolean)),
            path,
            "Completá los encabezados y las celdas de la tabla.",
          );
          break;
      }
    });
    value.agenda.forEach((row, index) => {
      required(Boolean(row.date), ["agenda", index, "date"], "Elegí la fecha.");
      required(
        Boolean(row.title),
        ["agenda", index, "title"],
        "Escribí la especialidad o actividad.",
      );
      if (value.expiresOn && row.date)
        required(
          value.expiresOn >= row.date,
          ["expiresOn"],
          "La vigencia no puede terminar antes de una fecha de la agenda.",
        );
    });
    value.sources.forEach((entry, index) => {
      required(
        Boolean(entry.label && entry.url),
        ["sources", index],
        "Completá el nombre y el enlace de la fuente.",
      );
    });
  },
) satisfies z.ZodType<ArticleInput>;
