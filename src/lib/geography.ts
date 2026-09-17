/** Stable geographic identifiers shared by URLs, forms, and the future database. */
export const PROVINCES = [
  { id: "buenos-aires", name: "Buenos Aires" },
  {
    id: "ciudad-autonoma-de-buenos-aires",
    name: "Ciudad Autónoma de Buenos Aires",
  },
  { id: "catamarca", name: "Catamarca" },
  { id: "chaco", name: "Chaco" },
  { id: "chubut", name: "Chubut" },
  { id: "cordoba", name: "Córdoba" },
  { id: "corrientes", name: "Corrientes" },
  { id: "entre-rios", name: "Entre Ríos" },
  { id: "formosa", name: "Formosa" },
  { id: "jujuy", name: "Jujuy" },
  { id: "la-pampa", name: "La Pampa" },
  { id: "la-rioja", name: "La Rioja" },
  { id: "mendoza", name: "Mendoza" },
  { id: "misiones", name: "Misiones" },
  { id: "neuquen", name: "Neuquén" },
  { id: "rio-negro", name: "Río Negro" },
  { id: "salta", name: "Salta" },
  { id: "san-juan", name: "San Juan" },
  { id: "san-luis", name: "San Luis" },
  { id: "santa-cruz", name: "Santa Cruz" },
  { id: "santa-fe", name: "Santa Fe" },
  { id: "santiago-del-estero", name: "Santiago del Estero" },
  {
    id: "tierra-del-fuego",
    name: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  },
  { id: "tucuman", name: "Tucumán" },
] as const;

export type ProvinceId = (typeof PROVINCES)[number]["id"];

export function getProvinceName(id?: string): string | undefined {
  return PROVINCES.find((province) => province.id === id)?.name;
}
