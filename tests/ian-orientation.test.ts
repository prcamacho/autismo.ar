import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIanLandscapeShell,
  IAN_LANDSCAPE_FRAME_ID,
  requireIanLandscape,
} from "../src/lib/ian-orientation";

test("embeds the real Ian app in a fitted landscape frame", () => {
  const origin = "https://ian.example";
  const shell = buildIanLandscapeShell(origin);

  assert.match(shell, /@media\(orientation:portrait\)/);
  assert.match(shell, /rotate\(90deg\)/);
  assert.match(shell, /landscapeWidth\/960/);
  assert.match(shell, /landscapeHeight\/540/);
  assert.match(shell, /visualViewport/);
  assert.match(shell, /src="https:\/\/ian\.example\/"/);
  assert.doesNotMatch(shell, /srcdoc=/);
  assert.doesNotMatch(shell, /scrolling=/);
  assert.match(shell, /screen-orientation" content="landscape"/);
  assert.match(shell, new RegExp(`id="${IAN_LANDSCAPE_FRAME_ID}"`));
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
