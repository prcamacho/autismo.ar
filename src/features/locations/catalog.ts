// Import only from server-side code. Client components use model.ts types and
// the paginated/limited endpoint, never this complete public catalog.
import data from "./catalog-data.json";
import type { Department, Place, PlaceSearch } from "./model";

export const LOCATION_CATALOG_VERSION = data.version;
export const LOCATION_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

const compare = new Intl.Collator("es-AR", {
  sensitivity: "base",
  numeric: true,
});
const departments: Department[] = data.departments.map(([id, province, name]) =>
  Object.freeze({ id, province, name }),
);
const departmentById = new Map(departments.map((d) => [d.id, d]));
const places: Place[] = data.places.map(
  ([id, province, departmentId, name, kind]) => {
    const department = departmentById.get(departmentId);
    if (
      !department ||
      department.province !== province ||
      !["locality", "neighborhood"].includes(kind)
    ) {
      throw new Error("El catálogo de ubicaciones no es válido.");
    }
    return Object.freeze({
      id,
      province,
      departmentId,
      department: department.name,
      name,
      kind: kind as Place["kind"],
    });
  },
);
const placeById = new Map(places.map((place) => [place.id, place]));
const placesByProvince = new Map<string, Place[]>();
for (const place of places) {
  const group = placesByProvince.get(place.province) ?? [];
  group.push(place);
  placesByProvince.set(place.province, group);
}
for (const group of placesByProvince.values()) {
  group.sort(
    (a, b) =>
      compare.compare(a.name, b.name) ||
      compare.compare(a.department, b.department) ||
      compare.compare(a.id, b.id),
  );
}
const searchText = new Map(
  places.map((p) => [p.id, normalized(`${p.name} ${p.department}`)]),
);

export function listDepartments(province: string): Department[] {
  return departments
    .filter((d) => d.province === province)
    .sort((a, b) => compare.compare(a.name, b.name));
}

/** Unknown jurisdiction/department returns no matches; never widens the search. */
export function searchPlaces({
  province,
  departmentId,
  query = "",
  limit = LOCATION_SEARCH_LIMIT,
}: PlaceSearch): Place[] {
  const size = Number.isFinite(limit)
    ? Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.trunc(limit)))
    : LOCATION_SEARCH_LIMIT;
  const terms = normalized(query.slice(0, 160)).split(/\s+/).filter(Boolean);
  return (placesByProvince.get(province) ?? [])
    .filter(
      (place) =>
        (!departmentId || place.departmentId === departmentId) &&
        terms.every((term) => searchText.get(place.id)!.includes(term)),
    )
    .slice(0, size);
}

/** Resolve IDs without trusting labels supplied by the browser. */
export function getPlaces(ids: readonly string[]): Place[] {
  return [...new Set(ids)].map((id) => {
    const place = placeById.get(id);
    if (!place)
      throw new Error(
        "Una de las ubicaciones no pertenece al catálogo vigente.",
      );
    return place;
  });
}
