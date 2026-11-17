import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmptyArticle } from "../src/features/articles/model";
import {
  createEditorSnapshot,
  reconcileEditorSnapshot,
} from "../src/features/articles/editor-revision";

const id = "10000000-0000-4000-8000-000000000001";
const saved = {
  ...createEmptyArticle(),
  title: "Artículo sintético",
  blocks: [{ type: "paragraph" as const, text: "Contenido de prueba." }],
};

test("submit and withdraw refreshes permit the next edit without discarding unsaved text", () => {
  let confirmed = createEditorSnapshot(id, 1, saved);
  const unsaved = { ...saved, title: "Cambios todavía en el editor" };

  // submitArticle changes revision/status, not data. The editor stays mounted.
  confirmed = reconcileEditorSnapshot(
    confirmed,
    createEditorSnapshot(id, 2, saved),
    false,
  );
  assert.equal(confirmed.revision, 2);
  assert.equal(unsaved.title, "Cambios todavía en el editor");

  // Saving the local changes with revision 2 succeeds and acknowledges revision 3.
  confirmed = createEditorSnapshot(id, confirmed.revision + 1, unsaved);
  // withdrawArticle changes metadata again. The subsequent save must send 4.
  confirmed = reconcileEditorSnapshot(
    confirmed,
    createEditorSnapshot(id, 4, unsaved),
    false,
  );
  assert.equal(confirmed.revision, 4);
});

test("JSONB key order and server trimming do not create false content conflicts", () => {
  const submitted = {
    ...saved,
    title: "  Artículo sintético  ",
    blocks: [{ type: "paragraph" as const, text: " Contenido de prueba. " }],
  };
  const confirmed = createEditorSnapshot(id, 3, submitted);
  const fromDatabase = Object.fromEntries(Object.entries(saved).reverse());
  const refreshed = reconcileEditorSnapshot(
    confirmed,
    createEditorSnapshot(id, 4, fromDatabase),
    false,
  );
  assert.equal(refreshed.revision, 4);
  assert.equal(submitted.title, "  Artículo sintético  ");
});

test("a concurrent content edit remains a conflict even when the local editor is dirty", () => {
  const confirmed = createEditorSnapshot(id, 5, saved);
  const otherEdit = { ...saved, showCafecito: true };
  const incoming = createEditorSnapshot(id, 6, otherEdit);
  assert.strictEqual(
    reconcileEditorSnapshot(confirmed, incoming, false),
    confirmed,
  );
  assert.equal(confirmed.revision, 5);
});

test("an in-flight save cannot adopt an intervening refresh of the old content", () => {
  const beforeSave = createEditorSnapshot(id, 1, saved);
  const laterOldContent = createEditorSnapshot(id, 3, saved);
  assert.strictEqual(
    reconcileEditorSnapshot(beforeSave, laterOldContent, true),
    beforeSave,
  );

  // The save committed different text as revision 2, then another editor restored
  // the old text as revision 3. Accepting 3 before acknowledging 2 would lose it.
  const ownSave = createEditorSnapshot(id, 2, {
    ...saved,
    title: "Mi cambio confirmado",
  });
  assert.strictEqual(
    reconcileEditorSnapshot(ownSave, laterOldContent, false),
    ownSave,
  );
});

test("older refreshes, another article and invalid content cannot advance the baseline", () => {
  const confirmed = createEditorSnapshot(id, 8, saved);
  assert.strictEqual(
    reconcileEditorSnapshot(
      confirmed,
      createEditorSnapshot(id, 7, saved),
      false,
    ),
    confirmed,
  );
  assert.strictEqual(
    reconcileEditorSnapshot(
      confirmed,
      createEditorSnapshot("another-id", 9, saved),
      false,
    ),
    confirmed,
  );
  assert.strictEqual(
    reconcileEditorSnapshot(
      confirmed,
      createEditorSnapshot(id, 9, { ...saved, title: null }),
      false,
    ),
    confirmed,
  );
});
