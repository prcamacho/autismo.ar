import { getProvinceName } from "./geography";

export const categories = [
  {
    id: "profesionales",
    name: "Profesionales",
    description: "Información de contacto, atención y especialidades.",
    icon: "stethoscope",
  },
  {
    id: "centros",
    name: "Centros y terapias",
    description: "Centros, espacios de atención y acompañamiento.",
    icon: "building",
  },
  {
    id: "educacion",
    name: "Educación",
    description:
      "Escuelas, apoyos y recursos para las trayectorias educativas.",
    icon: "book-open",
  },
  {
    id: "transporte",
    name: "Transporte",
    description: "Opciones de traslado y accesibilidad para moverse.",
    icon: "bus",
  },
  {
    id: "derechos",
    name: "Derechos y trámites",
    description:
      "Orientación para encontrar beneficios, trámites y sus fuentes.",
    icon: "file-text",
  },
  {
    id: "comunidad",
    name: "Redes de apoyo",
    description: "Grupos, encuentros y espacios de acompañamiento comunitario.",
    icon: "users",
  },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type ResourceScope = "national" | "province" | "local";

/**
 * One record can have several categories and geographic areas without being
 * duplicated. Personal experiences and editorial history will be separate
 * entities when contributions and moderation are implemented.
 */
export interface Resource {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryIds: readonly CategoryId[];
  scope: ResourceScope;
  provinceIds: readonly string[];
  locality?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    hours?: string;
  };
  sourceUrl?: string;
  lastConfirmedAt?: string;
}

export interface ResourceFilters {
  query?: string;
  category?: string;
  province?: string;
  locality?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Shared search contract for the initial catalog and a future database adapter.
 * National resources remain relevant to every province. Selecting a locality
 * narrows local records, but keeps national and matching provincial resources.
 * A locality requires a province to avoid mixing identically named places.
 */
export function filterResources(
  catalog: readonly Resource[],
  filters: ResourceFilters = {},
): Resource[] {
  const query = normalizeText(filters.query ?? "");
  const category = filters.category?.trim();
  const province = filters.province?.trim();
  const locality = normalizeText(filters.locality ?? "");

  if (category && !categories.some((item) => item.id === category)) return [];
  if (province && !getProvinceName(province)) return [];
  if (locality && !province) return [];

  return catalog.filter((resource) => {
    if (
      category &&
      !resource.categoryIds.some((categoryId) => categoryId === category)
    ) {
      return false;
    }

    if (province && resource.scope !== "national") {
      if (!resource.provinceIds.includes(province)) return false;

      if (
        locality &&
        resource.scope === "local" &&
        normalizeText(resource.locality ?? "") !== locality
      ) {
        return false;
      }
    }

    if (query) {
      const searchableText = normalizeText(
        [
          resource.name,
          resource.description,
          resource.locality,
          ...resource.provinceIds.map(getProvinceName),
          ...categories
            .filter((item) => resource.categoryIds.includes(item.id))
            .map((item) => item.name),
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
}
