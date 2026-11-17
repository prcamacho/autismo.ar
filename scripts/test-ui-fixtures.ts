/**
 * Shared UI actors for exchanges + articles, exclusively in the verified test project.
 * create: creates/resumes three synthetic accounts and writes login OTPs locally.
 * otp --actor professional|family|moderator: refreshes that actor's local OTP.
 * cleanup --confirmed-shared-qa-complete: only after BOTH UI sessions have finished.
 * All commands require --expected-host hmpqojhurrtujbcakzkv.supabase.co.
 * generateLink does not send SMTP. Never print the local JSON or its OTPs in logs.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { z } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  EXCHANGES_TEST_HOST,
  loadExchangeTestClients,
  requireSuccess,
  sanitizedFailure,
} from "./lib/exchanges-test-client";

const labels = ["professional", "family", "moderator"] as const;
type Label = (typeof labels)[number];
const directory = new URL("../test-results/exchanges/", import.meta.url);
const manifestPath = new URL("ui-fixtures.json", directory);
const lockPath = new URL("ui-fixtures.lock", directory);
const actorSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  otp: z
    .string()
    .regex(/^\d{6,10}$/)
    .optional(),
  otpGeneratedAt: z.iso.datetime().optional(),
  deleted: z.boolean().optional(),
});
const manifestSchema = z.object({
  version: z.literal(1),
  host: z.literal(EXCHANGES_TEST_HOST),
  runId: z.uuid(),
  createdAt: z.iso.datetime(),
  status: z.enum(["creating", "ready", "cleaning"]),
  actors: z.object({
    professional: actorSchema.optional(),
    family: actorSchema.optional(),
    moderator: actorSchema.optional(),
  }),
});
type Manifest = z.infer<typeof manifestSchema>;

function argument(name: string) {
  const at = process.argv.indexOf(name);
  return at < 0 ? undefined : process.argv[at + 1];
}
async function save(manifest: Manifest) {
  const temporary = new URL("ui-fixtures.pending.json", directory);
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporary, manifestPath);
}
async function readManifest() {
  try {
    return manifestSchema.parse(
      JSON.parse(await readFile(manifestPath, "utf8")),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("INVALID_FIXTURE_MANIFEST");
  }
}
function expectedEmail(manifest: Manifest, label: Label) {
  return `ui-${manifest.runId}-${label}@example.invalid`;
}
function verifyUser(user: User, manifest: Manifest, label: Label) {
  assert.equal(
    user.user_metadata.exchange_ui_run,
    manifest.runId,
    "fixture run mismatch",
  );
  assert.equal(
    user.user_metadata.exchange_ui_actor,
    label,
    "fixture actor mismatch",
  );
  assert.equal(
    user.email,
    expectedEmail(manifest, label),
    "synthetic email mismatch",
  );
}
async function recoverUsers(admin: SupabaseClient, manifest: Manifest) {
  for (let page = 1; page <= 10; page++) {
    const data = requireSuccess(
      "fixture_user_inventory",
      await admin.auth.admin.listUsers({ page, perPage: 100 }),
    );
    for (const user of data.users) {
      if (user.user_metadata.exchange_ui_run !== manifest.runId) continue;
      const label = labels.find(
        (entry) => entry === user.user_metadata.exchange_ui_actor,
      );
      assert.ok(label, "unrecognized actor in fixture run");
      verifyUser(user, manifest, label);
      const recorded = manifest.actors[label];
      assert.ok(
        !recorded || recorded.id === user.id,
        "duplicate actor in fixture run",
      );
      manifest.actors[label] = { ...recorded, id: user.id, email: user.email! };
    }
    if (data.users.length < 100) return;
  }
  throw new Error("FIXTURE_INVENTORY_LIMIT");
}
async function refreshOtp(
  admin: SupabaseClient,
  manifest: Manifest,
  label: Label,
) {
  const actor = manifest.actors[label];
  assert.ok(actor && !actor.deleted, "fixture actor is unavailable");
  const current = requireSuccess(
    "fixture_verify_actor",
    await admin.auth.admin.getUserById(actor.id),
  );
  assert.ok(current.user, "fixture account is unavailable");
  verifyUser(current.user, manifest, label);
  const link = requireSuccess(
    "fixture_generate_otp",
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: actor.email,
    }),
  );
  assert.ok(link.user && link.properties, "OTP generation returned no result");
  assert.equal(
    link.user.id,
    actor.id,
    "OTP recipient differs from fixture actor",
  );
  assert.match(
    link.properties.email_otp,
    /^\d{6,10}$/,
    "unexpected OTP format",
  );
  actor.otp = link.properties.email_otp;
  actor.otpGeneratedAt = new Date().toISOString();
  await save(manifest);
}
async function create(admin: SupabaseClient, previous: Manifest | null) {
  assert.ok(
    !previous || previous.status === "creating",
    "shared fixtures already exist; use otp to refresh access",
  );
  const manifest: Manifest = previous ?? {
    version: 1,
    host: EXCHANGES_TEST_HOST,
    runId: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "creating",
    actors: {},
  };
  await save(manifest); // Persist the recovery marker before the first remote mutation.
  await recoverUsers(admin, manifest);
  await save(manifest);
  for (const label of labels) {
    if (!manifest.actors[label]) {
      const result = requireSuccess(
        "fixture_create_actor",
        await admin.auth.admin.createUser({
          email: expectedEmail(manifest, label),
          email_confirm: true,
          user_metadata: {
            exchange_ui_run: manifest.runId,
            exchange_ui_actor: label,
          },
        }),
      );
      assert.ok(result.user, "fixture account creation returned no actor");
      verifyUser(result.user, manifest, label);
      manifest.actors[label] = {
        id: result.user.id,
        email: result.user.email!,
      };
      await save(manifest);
    }
  }
  requireSuccess(
    "fixture_assign_moderator",
    await admin
      .from("community_members")
      .upsert({ user_id: manifest.actors.moderator!.id, role: "moderator" }),
  );
  for (const label of labels) await refreshOtp(admin, manifest, label);
  manifest.status = "ready";
  await save(manifest);
  console.log(
    "PASS three shared UI actors ready; login values saved only in the ignored local fixture file. No email sent.",
  );
}
async function cleanup(admin: SupabaseClient, manifest: Manifest) {
  assert.ok(
    process.argv.includes("--confirmed-shared-qa-complete"),
    "cleanup requires completion of both shared UI sessions",
  );
  await recoverUsers(admin, manifest);
  manifest.status = "cleaning";
  await save(manifest);
  for (const label of labels) {
    const actor = manifest.actors[label];
    if (!actor || actor.deleted) continue;
    const current = await admin.auth.admin.getUserById(actor.id);
    if (current.error?.status !== 404) {
      const verified = requireSuccess("fixture_verify_cleanup", current);
      assert.ok(verified.user, "fixture actor not found");
      verifyUser(verified.user, manifest, label);
    }
    // Remove synthetic snapshots explicitly; real reported evidence is retained by the app.
    requireSuccess(
      "fixture_cleanup_reports",
      await admin.from("exchange_reports").delete().eq("reporter_id", actor.id),
    );
    const paths: string[] = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const photos = requireSuccess(
        "fixture_list_photos",
        await admin.storage
          .from("professional-photos")
          .list(actor.id, { limit: 100, offset }),
      );
      assert.ok(photos, "fixture photo listing returned no data");
      for (const photo of photos) {
        assert.match(
          photo.name,
          /^[0-9a-f-]{36}\.webp$/,
          "unexpected object in fixture photo folder",
        );
        paths.push(`${actor.id}/${photo.name}`);
      }
      if (photos.length < 100) break;
      assert.ok(offset < 900, "fixture photo inventory limit exceeded");
    }
    if (paths.length)
      requireSuccess(
        "fixture_cleanup_photos",
        await admin.storage.from("professional-photos").remove(paths),
      );
    for (const path of paths)
      requireSuccess(
        "fixture_cleanup_photo_tracking",
        await admin.rpc("exchange_photo_forget", { p_path: path }),
      );
    if (!current.error)
      requireSuccess(
        "fixture_delete_actor",
        await admin.auth.admin.deleteUser(actor.id),
      );
    actor.deleted = true;
    delete actor.otp;
    delete actor.otpGeneratedAt;
    await save(manifest);
  }
  await unlink(manifestPath);
  console.log(
    "PASS shared synthetic accounts, photos and local OTP file removed.",
  );
}
async function main() {
  const command = process.argv[2];
  assert.ok(
    ["create", "otp", "cleanup"].includes(command),
    "expected create, otp or cleanup",
  );
  const label = argument("--actor");
  if (command === "otp")
    assert.ok(
      labels.some((entry) => entry === label),
      "otp requires a valid --actor",
    );
  const { admin } = await loadExchangeTestClients(argument("--expected-host"));
  await mkdir(directory, { recursive: true });
  const lock = await open(lockPath, "wx", 0o600);
  try {
    const manifest = await readManifest();
    if (command === "create") await create(admin, manifest);
    else {
      assert.ok(manifest, "no shared fixtures are recorded");
      if (command === "cleanup") await cleanup(admin, manifest);
      else {
        assert.equal(manifest.status, "ready", "shared fixtures are not ready");
        await refreshOtp(admin, manifest, label as Label);
        console.log(
          "PASS requested login code refreshed in the ignored local fixture file. No email sent.",
        );
      }
    }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
void main().catch((error: unknown) => {
  sanitizedFailure("shared_ui_fixtures", error);
  console.error(
    "FAIL shared UI fixture operation; existing fixture state retained for recovery. Credentials and OTPs withheld.",
  );
  process.exitCode = 1;
});
