import assert from "node:assert/strict";
import test from "node:test";
import { searchBenefits } from "../src/features/nomenclator-preview/catalog";
import { isNomenclatorPreviewEnabled } from "../src/features/nomenclator-preview/availability";

test("la vista previa está cerrada en producción y entornos desconocidos", () => {
  assert.equal(isNomenclatorPreviewEnabled({ NODE_ENV: "production" }), false);
  assert.equal(isNomenclatorPreviewEnabled({}), false);
  assert.equal(
    isNomenclatorPreviewEnabled({
      NODE_ENV: "development",
      RAILWAY_ENVIRONMENT_NAME: "production",
    }),
    false,
  );
  assert.equal(
    isNomenclatorPreviewEnabled({
      NODE_ENV: "production",
      RAILWAY_ENVIRONMENT_NAME: "test",
    }),
    true,
  );
  assert.equal(isNomenclatorPreviewEnabled({ NODE_ENV: "development" }), true);
});

test("busca por palabras, tildes y siglas sin imponer equivalencias", () => {
  assert.equal(
    searchBenefits("  ESTIMULACION   temprana ")[0]?.id,
    "estimulacion-temprana",
  );
  assert.equal(searchBenefits("CET")[0]?.id, "centro-educativo-terapeutico");
  assert.equal(searchBenefits("fono").length, 3);
  assert.deepEqual(searchBenefits("FONOAUDIOLOGÍA"), searchBenefits("fono"));
  assert.equal(searchBenefits("MAI").length, 2);
  assert.equal(searchBenefits("acompañante terapéutico").length, 0);
});

test("combina texto y categoría y recupera el listado sin filtros", () => {
  assert.equal(searchBenefits("fono", "transporte").length, 0);
  assert.equal(searchBenefits("", "transporte")[0]?.id, "transporte");
  assert.ok(searchBenefits("").length > searchBenefits("", "educacion").length);
  assert.equal(searchBenefits("zzzz").length, 0);
});
