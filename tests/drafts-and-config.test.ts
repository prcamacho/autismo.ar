import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDraft, serializeDraft } from "../src/features/community/draft";
import { parseSupabaseSettings } from "../src/lib/supabase/config";

function draftForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Recurso sintético",
    description: "Descripción sintética de un recurso para pruebas.",
    categoryIds: "educacion",
    scope: "national",
    sourceUrl: "https://example.org",
    note: "Fuente sintética para pruebas",
    consent: "on",
  }))
    form.set(key, value);
  return form;
}
test("local drafts round-trip without changing their resource or version", () => {
  const contents = serializeDraft(draftForm());
  const loaded = parseDraft(contents, "", 0);
  assert.equal(loaded.resource.name, "Recurso sintético");
  assert.equal(loaded.resourceId, "");
  assert.equal(loaded.baseVersion, 0);
  assert.throws(
    () => parseDraft(contents, "10000000-0000-4000-8000-000000000001", 1),
    /otra ficha o versión/,
  );
  assert.throws(() => parseDraft("{", "", 0), /No pudimos leer/);
  assert.throws(() => parseDraft("x".repeat(30001), "", 0), /demasiado grande/);
  assert.throws(
    () => parseDraft(contents.replace("proposal-v1", "proposal-v2"), "", 0),
    /No pudimos leer/,
  );
  const form = draftForm();
  form.delete("consent");
  assert.throws(() => serializeDraft(form), /Confirmá/);
});
test("configuration distinguishes absent, incomplete and malformed settings", () => {
  assert.equal(parseSupabaseSettings().status, "unconfigured");
  assert.equal(parseSupabaseSettings(" ", " ").status, "unconfigured");
  for (const [url, key] of [
    ["invalid-url", "key"],
    ["https://example.test", ""],
    ["", "key"],
    ["ftp://example.test", "key"],
    ["https://user:secret@example.test", "key"],
  ]) {
    assert.deepEqual(parseSupabaseSettings(url, key), {
      status: "unavailable",
      config: null,
    });
  }
  assert.equal(
    parseSupabaseSettings("https://example.test", "public-test-key").status,
    "ready",
  );
});
