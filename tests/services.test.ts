import { test } from "node:test";
import assert from "node:assert/strict";
import { searchServices, normalizeTerm } from "../src/features/services/model";
import { INITIAL_SERVICES } from "../src/features/services/seed";

test("service suggestions resolve aliases, accents, spacing and conservative misspellings", () => {
  for (const query of [
    "fono",
    "FONO",
    " Fonoaudiología ",
    "fonoadiologia",
    "fonoaudiológa",
  ])
    assert.equal(
      searchServices(INITIAL_SERVICES, query)[0]?.id,
      "fonoaudiologia",
      query,
    );
  assert.equal(
    searchServices(INITIAL_SERVICES, "neuropediatra")[0]?.id,
    "neurologia-infantil",
  );
  assert.equal(
    searchServices(INITIAL_SERVICES, "terapia    ocupa")[0]?.id,
    "terapia-ocupacional",
  );
  assert.deepEqual(
    searchServices(INITIAL_SERVICES, "psico")
      .map((s) => s.id)
      .sort(),
    ["psicologia", "psicomotricidad", "psicopedagogia"],
  );
  assert.equal(searchServices(INITIAL_SERVICES, "zzzzzzzz").length, 0);
  assert.equal(
    searchServices(INITIAL_SERVICES, "fonoadiologia")[0]?.approximate,
    true,
  );
  assert.equal(normalizeTerm("  FONOAUDIOLOGÍA  "), "fonoaudiologia");
});

test("catalog has the approved 33 unique services and keeps broad legacy labels out of choices", () => {
  assert.equal(INITIAL_SERVICES.length, 33);
  assert.equal(new Set(INITIAL_SERVICES.map((s) => s.id)).size, 33);
  assert.equal(
    INITIAL_SERVICES.filter((s) => s.group_name === "Especialidades médicas")
      .length,
    22,
  );
  assert.ok(
    !INITIAL_SERVICES.some(
      (s) => s.id === "otros-apoyos" || s.id === "medicina",
    ),
  );
});
