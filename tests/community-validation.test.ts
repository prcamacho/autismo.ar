import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proposalInputSchema,
  resourceInputSchema,
  isPublicHttpUrl,
} from "../src/features/resources/validation";
import { requiredFields } from "../src/features/community/fields";
const resource = {
  name: "Recurso de prueba",
  description: "Una descripción sintética para validar el formulario.",
  categoryIds: ["educacion"],
  scope: "national" as const,
  province: "",
  locality: "",
  website: "",
  phone: "",
  hours: "",
  coverage: "",
  ageGroups: [],
};
test("resource validation normalizes geography, rejects unsafe links and needs consent", () => {
  assert.equal(
    resourceInputSchema.parse({
      ...resource,
      province: "salta",
      locality: "Capital",
    }).province,
    "",
  );
  assert.equal(
    resourceInputSchema.safeParse({ ...resource, scope: "local" }).success,
    false,
  );
  assert.equal(
    resourceInputSchema.safeParse({ ...resource, categoryIds: ["unknown"] })
      .success,
    false,
  );
  assert.equal(isPublicHttpUrl("javascript:alert(1)"), false);
  assert.equal(isPublicHttpUrl("https://user:secret@example.org"), false);
  assert.equal(
    proposalInputSchema.safeParse({
      resource,
      resourceId: "",
      baseVersion: 0,
      sourceUrl: "https://example.org",
      note: "Fuente de prueba",
      consent: false,
    }).success,
    false,
  );
});
test("corroboration is required for each changed group, including removed facts", () => {
  const data = resourceInputSchema.parse(resource);
  assert.deepEqual(requiredFields(data), ["name", "location", "description"]);
  assert.deepEqual(requiredFields({ ...data, phone: "dato sintético" }, data), [
    "contact",
  ]);
  assert.deepEqual(
    requiredFields(data, { ...data, coverage: "dato sintético" }),
    ["coverage"],
  );
  assert.deepEqual(requiredFields(data, data), ["description"]);
});
