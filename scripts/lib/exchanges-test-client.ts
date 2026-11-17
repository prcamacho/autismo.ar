import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { exchangeStatus } from "../../src/features/exchanges/settings";

/** Independently verified isolated test project. Never accept an arbitrary CLI host. */
export const EXCHANGES_TEST_HOST = "hmpqojhurrtujbcakzkv.supabase.co";

function jwtRole(key: string) {
  if (!key.startsWith("eyJ")) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
    );
    assert.equal(
      payload.ref,
      EXCHANGES_TEST_HOST.split(".")[0],
      "credential project differs from test target",
    );
    return payload.role as unknown;
  } catch {
    throw new Error("INVALID_TEST_KEY");
  }
}

export function sanitizedFailure(operation: string, error: unknown) {
  if (typeof error !== "object" || error === null) return;
  const details = error as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
  };
  const code =
    typeof details.code === "string" && /^[a-z0-9_]{1,64}$/i.test(details.code)
      ? details.code
      : "unknown";
  const domainCode =
    typeof details.message === "string" &&
    /^[A-Z_]{3,60}$/.test(details.message)
      ? details.message
      : undefined;
  console.error(
    JSON.stringify({
      operation,
      code,
      domainCode,
      status: typeof details.status === "number" ? details.status : undefined,
    }),
  );
}

export function requireSuccess<T extends { data: unknown; error: unknown }>(
  operation: string,
  result: T,
): T["data"] {
  if (result.error) {
    sanitizedFailure(operation, result.error);
    throw new Error("TEST_OPERATION_FAILED");
  }
  return result.data;
}

export async function loadExchangeTestClients(
  expectedHost: string | undefined,
) {
  assert.equal(
    expectedHost,
    EXCHANGES_TEST_HOST,
    "the explicit independently verified test host is required",
  );
  // Deliberately ignore .env.local and ambient process.env, which may reference production.
  const env = parseEnv(
    await readFile(
      new URL("../../.env.exchanges-test.local", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    env.EXCHANGES_EXPECTED_SUPABASE_HOST,
    expectedHost,
    "file target differs from reviewed target",
  );
  assert.equal(
    exchangeStatus(env),
    "ready",
    "isolated module must be enabled and host-bound",
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const secret = env.EXCHANGES_SUPABASE_SECRET_KEY ?? "";
  assert.ok(url && key && secret, "test-only URL and credentials are required");
  assert.equal(new URL(url).host, expectedHost);
  assert.ok(
    key.startsWith("sb_publishable_") || jwtRole(key) === "anon",
    "browser credential must not be privileged",
  );
  assert.ok(
    secret.startsWith("sb_secret_") || jwtRole(secret) === "service_role",
    "test service credential is required",
  );
  const transport: typeof fetch = (input, init) => {
    const target = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    assert.equal(target.protocol, "https:");
    assert.equal(
      target.host,
      expectedHost,
      "only the verified Supabase test host may be called",
    );
    const timeout = AbortSignal.timeout(15_000);
    return fetch(input, {
      ...init,
      redirect: "error",
      signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  };
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: transport },
  };
  return {
    admin: createClient(url, secret, options),
    anonymous: createClient(url, key, options),
    createBrowserClient: () => createClient(url, key, options),
  };
}
