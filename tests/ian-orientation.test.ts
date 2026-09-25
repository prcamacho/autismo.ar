import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIanLandscapeShell,
  IAN_LANDSCAPE_FRAME_ID,
  prepareIanEmbeddedDocument,
  requireIanLandscape,
} from "../src/lib/ian-orientation";

test("embeds Ian in a landscape frame and loads its assets from the authorized origin", () => {
  const original =
    '<!doctype html><html><head><title>Ian</title></head><body class="app"><div id="app"></div></body></html>';
  const origin = "https://ian.example";
  const embedded = prepareIanEmbeddedDocument(original, origin);
  const shell = buildIanLandscapeShell(original, origin);

  assert.match(embedded, /<head><base href="https:\/\/ian\.example\/">/);
  assert.match(shell, /@media\(orientation:portrait\)/);
  assert.match(shell, /rotate\(90deg\)/);
  assert.match(shell, /screen-orientation" content="landscape"/);
  assert.match(shell, new RegExp(`id="${IAN_LANDSCAPE_FRAME_ID}"`));
  assert.match(shell, /srcdoc="&lt;!doctype html&gt;/);
  assert.doesNotMatch(shell, /Gir&aacute; tu dispositivo/);
});

test("forces landscape without changing the rest of the manifest", () => {
  const manifest = {
    name: "App de Ian",
    start_url: "./",
    scope: "./",
    orientation: "any",
  };

  assert.deepEqual(requireIanLandscape(manifest), {
    ...manifest,
    orientation: "landscape",
  });
  assert.equal(manifest.orientation, "any");
});

test("rejects an invalid manifest", () => {
  assert.throws(() => requireIanLandscape(null), TypeError);
  assert.throws(() => requireIanLandscape([]), TypeError);
});
