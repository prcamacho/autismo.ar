import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPlaces,
  listDepartments,
  searchPlaces,
} from "../src/features/locations/catalog";
import { PROVINCES } from "../src/lib/geography";

test("el catálogo cubre las 24 jurisdicciones con identificadores existentes", () => {
  for (const province of PROVINCES) {
    assert.ok(listDepartments(province.id).length, province.name);
    assert.ok(searchPlaces({ province: province.id }).length, province.name);
  }
  assert.equal(listDepartments("buenos-aires").length, 135);
  assert.equal(listDepartments("ciudad-autonoma-de-buenos-aires").length, 15);
  const barrios = searchPlaces({
    province: "ciudad-autonoma-de-buenos-aires",
    limit: 100,
  });
  assert.equal(barrios.length, 48);
  assert.ok(barrios.every((barrio) => barrio.kind === "neighborhood"));
  assert.ok(barrios.some((barrio) => barrio.name === "Caballito"));
});

test("partidos y localidades mantienen su relación y búsqueda sin tildes", () => {
  const moron = listDepartments("buenos-aires").find(
    (d) => d.name === "Morón",
  )!;
  assert.ok(moron);
  const matches = searchPlaces({
    province: "buenos-aires",
    departmentId: moron.id,
    query: "moron",
  });
  assert.ok(matches.some((place) => place.name === "Morón"));
  assert.ok(matches.every((place) => place.departmentId === moron.id));
  assert.deepEqual(
    searchPlaces({ province: "salta", departmentId: moron.id }),
    [],
  );
  assert.deepEqual(searchPlaces({ province: "provincia-inexistente" }), []);
});

test("los homónimos conservan IDs distintos y los resultados están acotados", () => {
  const matches = PROVINCES.flatMap((province) =>
    searchPlaces({ province: province.id, query: "San Martín", limit: 100 }),
  );
  assert.ok(matches.length > 1);
  assert.equal(new Set(matches.map((place) => place.id)).size, matches.length);
  assert.ok(new Set(matches.map((place) => place.province)).size > 1);
  assert.equal(
    searchPlaces({ province: "buenos-aires", limit: 100_000 }).length,
    100,
  );
  assert.equal(searchPlaces({ province: "buenos-aires" }).length, 50);
});

test("resolver selecciones quita duplicados y rechaza ubicaciones inventadas", () => {
  const places = searchPlaces({ province: "buenos-aires", limit: 2 });
  assert.deepEqual(getPlaces([places[1].id, places[0].id, places[1].id]), [
    places[1],
    places[0],
  ]);
  assert.throws(
    () => getPlaces([places[0].id, "georef:inventado"]),
    /catálogo/,
  );
  assert.deepEqual(getPlaces([]), []);
  assert.ok(Object.isFrozen(places[0]));
});
