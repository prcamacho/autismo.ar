import assert from "node:assert/strict";
import { test } from "node:test";
import { siteUrl } from "../src/lib/site-url";

test("shared links stay on the configured origin and reject unsafe destinations", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://test.autismo.ar";
    assert.equal(
      siteUrl("/articulos/prueba"),
      "https://test.autismo.ar/articulos/prueba",
    );
    for (const path of [
      "https://example.org",
      "//example.org",
      "/\\example.org",
    ]) {
      assert.throws(() => siteUrl(path));
    }
    for (const origin of [
      "http://test.autismo.ar",
      "https://name:password@example.org",
      "https://example.org/path",
      "https://example.org?key=value",
      "javascript:alert(1)",
    ]) {
      process.env.NEXT_PUBLIC_SITE_URL = origin;
      assert.throws(() => siteUrl("/articulos/prueba"));
    }
    process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3011";
    assert.equal(
      siteUrl("/articulos/prueba"),
      "http://127.0.0.1:3011/articulos/prueba",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
