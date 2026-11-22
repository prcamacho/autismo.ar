import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyticsAllowed,
  analyticsConfig,
  analyticsPath,
  pageviewProperties,
  sanitizePageview,
} from "../src/lib/analytics";

const production = {
  POSTHOG_ENABLED: "true",
  NODE_ENV: "production",
  RAILWAY_ENVIRONMENT_NAME: "production",
  NEXT_PUBLIC_SITE_URL: "https://autismo.ar",
  POSTHOG_PROJECT_TOKEN: "phc_testTokenOnly",
};
const sessionId = "019aab12-1234-7123-8123-123456789abc";

test("analytics fails closed outside the explicitly configured production environment", () => {
  assert.deepEqual(analyticsConfig(production), {
    token: production.POSTHOG_PROJECT_TOKEN,
  });
  assert.equal(analyticsConfig({}), null);
  for (const override of [
    { POSTHOG_ENABLED: "false" },
    { NODE_ENV: "development" },
    { RAILWAY_ENVIRONMENT_NAME: "test" },
    { RAILWAY_ENVIRONMENT_NAME: undefined },
    { NEXT_PUBLIC_SITE_URL: "https://test.autismo.ar" },
    { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
    { POSTHOG_PROJECT_TOKEN: "phx_neverAcceptAPersonalKey" },
    { POSTHOG_PROJECT_TOKEN: "" },
  ])
    assert.equal(analyticsConfig({ ...production, ...override }), null);
});

test("browser origin and privacy preferences prevent capture even with production config", () => {
  assert.equal(analyticsAllowed("https://autismo.ar", null), true);
  for (const origin of [
    "https://test.autismo.ar",
    "http://localhost:3000",
    "https://autismo.ar.evil.example",
    "http://autismo.ar",
  ]) {
    assert.equal(analyticsAllowed(origin, null), false);
  }
  assert.equal(analyticsAllowed("https://autismo.ar", "1"), false);
  assert.equal(analyticsAllowed("https://autismo.ar", "yes"), false);
  assert.equal(analyticsAllowed("https://autismo.ar", null, true), false);
});

test("private routes and unknown pages never become analytics events", () => {
  for (const path of [
    "/cuenta",
    "/cuenta/perfil-autor",
    "/mensajes",
    "/mensajes/123",
    "/aportar",
    "/busquedas/123",
    "/busquedas/nueva",
    "/busquedas/perfil",
    "/comunidad/revisar",
    "/articulos/nuevo",
    "/catalogo/solicitar",
    "/api/ubicaciones",
    "/unknown",
    "/?email=private@example.org",
  ]) {
    assert.equal(analyticsPath(path), null, path);
  }
  assert.equal(analyticsPath("/directorio"), "/directorio");
  assert.equal(
    analyticsPath("/articulos/12345678-1234-1234-1234-123456789abc"),
    "/articulos/[id]",
  );
  assert.equal(
    analyticsPath("/articulos/autores/12345678-1234-1234-1234-123456789abc"),
    "/articulos/autores/[id]",
  );
});

test("the payload has a closed schema with no content, account identity, referrer or search text", () => {
  const distinctId = "autismo.ar:12345678-1234-1234-1234-123456789abc";
  const properties = pageviewProperties(
    "/articulos/[id]",
    distinctId,
    sessionId,
  )!;
  assert.deepEqual(
    Object.keys(properties).sort(),
    [
      "distinct_id",
      "$session_id",
      "$current_url",
      "$host",
      "$pathname",
      "$process_person_profile",
      "$geoip_disable",
      "$ip",
      "site",
      "environment",
    ].sort(),
  );
  assert.equal(properties.$current_url, "https://autismo.ar/articulos/[id]");
  assert.equal(properties.$ip, "0.0.0.0");
  assert.equal(properties.$geoip_disable, true);
  assert.equal(properties.$process_person_profile, false);
  assert.equal(pageviewProperties("/cuenta", distinctId, sessionId), null);
  assert.equal(
    pageviewProperties("/directorio?q=diagnostico", distinctId, sessionId),
    null,
  );
  assert.equal(pageviewProperties("/", "private@example.org", sessionId), null);
  assert.equal(
    pageviewProperties("/", distinctId, "private@example.org"),
    null,
  );
  assert.equal(properties.$session_id, sessionId);
});

test("the SDK hook drops automatic events and removes even top-level profile properties", () => {
  const event = {
    event: "$pageview",
    uuid: "12345678-1234-1234-1234-123456789abc",
    $set: { email: "private@example.org" },
    $set_once: { $initial_current_url: "https://autismo.ar/?secret=hidden" },
    properties: {
      distinct_id: "autismo.ar:12345678-1234-1234-1234-123456789abc",
      $session_id: sessionId,
      $pathname: "/directorio",
      $current_url: "https://autismo.ar/directorio?q=private",
      $referrer: "https://private.example/secret",
      email: "private@example.org",
      $ip: "192.0.2.1",
    },
  };
  const clean = sanitizePageview(event, "phc_testTokenOnly")!;
  const serialized = JSON.stringify(clean);
  for (const sensitive of [
    "private",
    "secret",
    "email",
    "$set",
    "$referrer",
    "192.0.2.1",
  ])
    assert.equal(serialized.includes(sensitive), false);
  assert.equal(clean.properties.token, "phc_testTokenOnly");
  for (const name of [
    "$autocapture",
    "$pageleave",
    "$identify",
    "$exception",
    "$snapshot",
    "flow_step",
  ]) {
    assert.equal(
      sanitizePageview({ ...event, event: name }, "phc_testTokenOnly"),
      null,
    );
  }
});
