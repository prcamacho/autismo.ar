/** Launch Next with the explicitly provisioned test project, without inheriting app credentials. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";

const command = process.argv[2];
assert.ok(
  ["dev", "build", "start"].includes(command),
  "Use dev, build or start.",
);
const settings = parseEnv(await readFile(".env.exchanges-test.local", "utf8"));
const documented = parseEnv(await readFile(".env.example", "utf8"));
const expectedHost = "hmpqojhurrtujbcakzkv.supabase.co";
assert.equal(
  new URL(settings.NEXT_PUBLIC_SUPABASE_URL).origin,
  `https://${expectedHost}`,
);
assert.equal(settings.EXCHANGES_EXPECTED_SUPABASE_HOST, expectedHost);
assert.equal(settings.ARTICLES_EXPECTED_SUPABASE_HOST, expectedHost);
assert.equal(
  settings.EXCHANGES_EMAIL_DAILY_BUDGET,
  "0",
  "Email must remain disabled in this test workflow.",
);
assert.ok(
  settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"),
);
assert.ok(
  settings.NEXT_PUBLIC_SITE_URL,
  "The test site origin must be explicit.",
);

// process.env has priority over Next's .env files, including .env.local. Set
// every documented app variable (even absent options) so no production default
// fills a gap. The source files and the parent shell remain unchanged.
const env = { ...process.env };
for (const key of Object.keys(documented)) env[key] = settings[key] ?? "";
env.EXCHANGES_RESEND_API_KEY = "";
env.EXCHANGES_EMAIL_FROM = "";
const args = ["node_modules/next/dist/bin/next", command];
if (command !== "build") args.push("--hostname", "127.0.0.1", "--port", "3011");
const child = spawn(process.execPath, args, {
  env,
  stdio: "inherit",
  windowsHide: true,
});
child.on("error", () => {
  console.error("The isolated Next process could not start.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
