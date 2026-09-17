import assert from "node:assert/strict";
import test from "node:test";
import { filterResources, type Resource } from "../src/lib/catalog";

// Synthetic records exist only in tests and never enter the public catalog.
const fixture: readonly Resource[] = [
  {
    id: "national",
    slug: "national-test",
    name: "Guía de prueba nacional",
    description: "Orientación para la comunidad.",
    categoryIds: ["comunidad", "derechos"],
    scope: "national",
    provinceIds: [],
  },
  {
    id: "provincial",
    slug: "provincial-test",
    name: "Red de prueba provincial",
    description: "Recurso de prueba.",
    categoryIds: ["comunidad"],
    scope: "province",
    provinceIds: ["buenos-aires"],
  },
  {
    id: "local",
    slug: "local-test",
    name: "Espacio de prueba local",
    description: "Información de atención.",
    categoryIds: ["comunidad", "centros"],
    scope: "local",
    provinceIds: ["buenos-aires"],
    locality: "Bahía Blanca",
  },
  {
    id: "other-locality",
    slug: "other-locality-test",
    name: "Espacio de otra localidad",
    description: "Recurso de prueba.",
    categoryIds: ["comunidad"],
    scope: "local",
    provinceIds: ["buenos-aires"],
    locality: "La Plata",
  },
  {
    id: "other-province",
    slug: "other-province-test",
    name: "Espacio de otra provincia",
    description: "Recurso de prueba.",
    categoryIds: ["comunidad"],
    scope: "province",
    provinceIds: ["cordoba"],
  },
];

test("local search retains national and provincial guidance while narrowing local records", () => {
  const result = filterResources(fixture, {
    province: "buenos-aires",
    locality: "  BAHIA   blanca  ",
    category: "comunidad",
  });

  assert.deepEqual(
    result.map((resource) => resource.id),
    ["national", "provincial", "local"],
  );
});

test("province search includes its local resources without borrowing another province", () => {
  assert.deepEqual(
    filterResources(fixture, { province: "buenos-aires" }).map(
      (resource) => resource.id,
    ),
    ["national", "provincial", "local", "other-locality"],
  );
});

test("national scope still respects category and accent-insensitive text filters", () => {
  assert.deepEqual(
    filterResources(fixture, {
      province: "cordoba",
      category: "derechos",
      query: "ORIENTACION",
    }).map((resource) => resource.id),
    ["national"],
  );
  assert.deepEqual(
    filterResources(fixture, { province: "cordoba", category: "centros" }),
    [],
  );
});

test("invalid geographic/category filters and ambiguous localities never broaden search", () => {
  assert.deepEqual(
    filterResources(fixture, { province: "does-not-exist" }),
    [],
  );
  assert.deepEqual(
    filterResources(fixture, { category: "does-not-exist" }),
    [],
  );
  assert.deepEqual(filterResources(fixture, { locality: "Bahía Blanca" }), []);
});
