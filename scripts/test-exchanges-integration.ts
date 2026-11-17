/**
 * Explicit integration test for a separately verified Supabase TEST project.
 * Never reads .env.local, requests an OTP, sends email or invokes the notification worker.
 *
 * Run only after reviewing the target and applying its migrations:
 * node --import tsx scripts/test-exchanges-integration.ts --expected-host TEST_PROJECT.supabase.co
 *
 * The host argument must come from an independently verified test project. Matching
 * names in an environment file alone do not prove environment isolation.
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  loadExchangeTestClients,
  sanitizedFailure,
} from "./lib/exchanges-test-client";
import type { ListingData, ProfileData } from "../src/features/exchanges/model";

const BUCKET = "professional-photos";
type Actor = { id: string; client: SupabaseClient };
type RpcResponse = { data: unknown; error: { message: string } | null };

function succeeded<T>(result: RpcResponse): T {
  if (result.error) sanitizedFailure("rpc_or_query", result.error);
  assert.equal(
    result.error,
    null,
    "operation must succeed; provider details intentionally omitted",
  );
  return result.data as T;
}
function rejected(result: RpcResponse, expected?: string) {
  assert.ok(result.error, "operation must be rejected");
  if (expected)
    assert.ok(
      result.error.message.includes(expected),
      `expected ${expected}; provider details intentionally omitted`,
    );
}

async function main() {
  const flag = process.argv.indexOf("--expected-host");
  const expectedHost = flag >= 0 ? process.argv[flag + 1] : undefined;
  const { admin, anonymous, createBrowserClient } =
    await loadExchangeTestClients(expectedHost);
  const runId = randomUUID();
  const users = new Set<string>();
  const paths = new Set<string>();
  let stage = "schema preflight";
  let complete = false;
  let cleanupErrors = 0;

  async function actor(label: string): Promise<Actor> {
    stage = `synthetic ${label} account creation`;
    const email = `exchange-${runId}-${label}@example.invalid`;
    const password = `${randomBytes(32).toString("base64url")}aA1!`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { exchange_integration_run: runId },
    });
    if (created.error) sanitizedFailure("auth_create", created.error);
    assert.equal(
      created.error,
      null,
      "synthetic account creation failed; details withheld",
    );
    assert.ok(created.data.user);
    users.add(created.data.user.id);
    const client = createBrowserClient();
    stage = `synthetic ${label} password sign-in`;
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error) sanitizedFailure("auth_password_sign_in", signed.error);
    assert.equal(
      signed.error,
      null,
      "password-only test sign-in failed; no email fallback is allowed",
    );
    assert.ok(signed.data.session);
    stage = `synthetic ${label} adult acknowledgement`;
    succeeded(
      await client.rpc("exchange_enroll", {
        p_adult: true,
        p_notifications: false,
      }),
    );
    return { id: created.data.user.id, client };
  }
  async function currentVersion(
    client: SupabaseClient,
    table: "exchange_profiles" | "exchange_listings",
    id: string,
  ) {
    const result = await client
      .from(table)
      .select("version")
      .eq("id", id)
      .single();
    assert.equal(result.error, null);
    return result.data!.version as number;
  }
  async function approve(
    client: SupabaseClient,
    kind: "profile" | "listing",
    id: string,
  ) {
    const table =
      kind === "profile" ? "exchange_profiles" : "exchange_listings";
    const version = await currentVersion(client, table, id);
    succeeded(
      await client.rpc("exchange_moderate", {
        p_kind: kind,
        p_id: id,
        p_decision: "approved",
        p_note: "Revisión sintética para la prueba de integración",
        p_version: version,
      }),
    );
  }

  try {
    const locations = await anonymous
      .from("exchange_places")
      .select("id")
      .eq("province", "buenos-aires")
      .order("id")
      .limit(2);
    assert.equal(locations.error, null);
    assert.equal(
      locations.data?.length,
      2,
      "official location catalog is required",
    );
    const placeIds = locations.data!.map((p) => String(p.id));
    const bucket = await admin.storage.getBucket(BUCKET);
    assert.equal(bucket.error, null);
    assert.equal(bucket.data?.public, false);
    rejected(await anonymous.from("exchange_profiles").select("id").limit(1));
    console.log("PASS schema and private storage preflight");

    stage = "synthetic accounts";
    const professional = await actor("professional");
    const family = await actor("family");
    const stranger = await actor("stranger");
    const moderator = await actor("moderator");
    stage = "synthetic moderator role assignment";
    const assigned = await admin
      .from("community_members")
      .upsert({ user_id: moderator.id, role: "moderator" });
    if (assigned.error)
      sanitizedFailure("assign_test_moderator", assigned.error);
    assert.equal(assigned.error, null);

    stage = "private photo storage";
    succeeded(await professional.client.rpc("exchange_reserve_photo", {}));
    const photo = await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#5488aa" },
    })
      .webp()
      .toBuffer();
    const path = `${professional.id}/${randomUUID()}.webp`;
    paths.add(path);
    succeeded(
      await admin.rpc("exchange_photo_track", {
        p_path: path,
        p_user: professional.id,
      }),
    );
    const uploaded = await admin.storage
      .from(BUCKET)
      .upload(path, photo, { contentType: "image/webp", upsert: false });
    assert.equal(uploaded.error, null);
    assert.ok((await anonymous.storage.from(BUCKET).download(path)).error);
    assert.ok(
      (await professional.client.storage.from(BUCKET).download(path)).error,
      "signed-in users cannot bypass the authorized image endpoint",
    );
    const unauthorizedPath = `${stranger.id}/${randomUUID()}.webp`;
    paths.add(unauthorizedPath);
    assert.ok(
      (
        await stranger.client.storage
          .from(BUCKET)
          .upload(unauthorizedPath, photo, { contentType: "image/webp" })
      ).error,
    );
    const downloaded = await admin.storage.from(BUCKET).download(path);
    assert.equal(downloaded.error, null);
    assert.ok(downloaded.data);
    assert.deepEqual(Buffer.from(await downloaded.data.arrayBuffer()), photo);

    stage = "profile privacy and moderation";
    const profile: ProfileData = {
      name: "Perfil sintético de integración",
      title: "Formación sintética declarada",
      institution: "Institución de prueba",
      graduationYear: 2015,
      registration: "",
      experienceYears: 4,
      description:
        "Perfil exclusivamente sintético para verificar el entorno aislado.",
      ageGroups: ["Infancia"],
      photoPath: path,
    };
    const profileId = succeeded<string>(
      await professional.client.rpc("exchange_save_profile", {
        p_data: profile,
        p_public: true,
        p_version: 0,
      }),
    );
    assert.equal(
      succeeded<unknown[]>(
        await anonymous.rpc("exchange_profile", { p_id: profileId }),
      ).length,
      0,
    );
    rejected(
      await stranger.client.rpc("exchange_photo_access", {
        p_profile: profileId,
        p_viewer: professional.id,
      }),
    );
    assert.equal(
      succeeded<unknown[]>(
        await admin.rpc("exchange_photo_access", {
          p_profile: profileId,
          p_viewer: null,
        }),
      ).length,
      0,
    );
    assert.equal(
      succeeded<unknown[]>(
        await admin.rpc("exchange_photo_access", {
          p_profile: profileId,
          p_viewer: professional.id,
        }),
      ).length,
      1,
    );
    rejected(
      await professional.client.rpc("exchange_moderate", {
        p_kind: "profile",
        p_id: profileId,
        p_decision: "approved",
        p_note: "No puede moderar su propio perfil",
        p_version: 1,
      }),
      "MODERATOR_REQUIRED",
    );
    await approve(moderator.client, "profile", profileId);
    const publicProfile = succeeded<{ data: Record<string, unknown> }[]>(
      await anonymous.rpc("exchange_profile", { p_id: profileId }),
    );
    assert.equal(publicProfile.length, 1);
    assert.equal(publicProfile[0].data.hasPhoto, true);
    assert.equal("photoPath" in publicProfile[0].data, false);
    assert.equal(
      JSON.stringify(publicProfile).includes(professional.id),
      false,
    );
    console.log("PASS profile moderation, public DTO and private photo access");

    stage = "multi-location publication and opt-in";
    let listing: ListingData = {
      title: "Oferta sintética para integración aislada",
      service: "inclusion-escolar",
      role: "Apoyo escolar",
      description:
        "Aviso sintético de integración que se eliminará al terminar la comprobación.",
      modality: "presencial",
      days: ["lunes"],
      shifts: ["manana"],
      startDate: "",
      availability: "available",
      engagement: "A convenir",
      ageGroups: ["Infancia"],
      locationIds: placeIds,
      receiveRequests: false,
    };
    const creationNonce = randomUUID();
    const createArgs = {
      p_id: null,
      p_kind: "offer",
      p_data: listing,
      p_version: 0,
      p_nonce: creationNonce,
    };
    const offer = succeeded<string>(
      await professional.client.rpc("exchange_save_listing", createArgs),
    );
    assert.equal(
      succeeded<string>(
        await professional.client.rpc("exchange_save_listing", createArgs),
      ),
      offer,
    );
    rejected(
      await professional.client.rpc("exchange_save_listing", {
        ...createArgs,
        p_data: { ...listing, title: "Contenido cambiado con el mismo envío" },
      }),
      "NONCE_REUSED",
    );
    await approve(moderator.client, "listing", offer);
    for (const place of ["", ...placeIds]) {
      const results = succeeded<{ id: string }[]>(
        await anonymous.rpc("exchange_search", {
          p_kind: "offer",
          p_service: "inclusion-escolar",
          p_province: "buenos-aires",
          p_place: place,
          p_page: 1,
          p_modality: "presencial",
          p_availability: "available",
        }),
      );
      assert.equal(results.filter((item) => item.id === offer).length, 1);
    }
    rejected(
      await family.client.rpc("exchange_request", {
        p_listing: offer,
        p_body: "Presentación sintética sin consentimiento de contacto",
        p_nonce: randomUUID(),
      }),
      "LISTING_UNAVAILABLE",
    );
    listing = { ...listing, receiveRequests: true };
    succeeded(
      await professional.client.rpc("exchange_save_listing", {
        ...createArgs,
        p_id: offer,
        p_data: listing,
        p_version: await currentVersion(
          professional.client,
          "exchange_listings",
          offer,
        ),
      }),
    );
    await approve(moderator.client, "listing", offer);
    console.log(
      "PASS multi-location discovery, creation idempotency and contact opt-in",
    );

    stage = "private conversation and independent roles";
    const intro = {
      p_listing: offer,
      p_body: "Presentación sintética privada de integración",
      p_nonce: randomUUID(),
    };
    const conversation = succeeded<string>(
      await family.client.rpc("exchange_request", intro),
    );
    assert.equal(
      succeeded<string>(await family.client.rpc("exchange_request", intro)),
      conversation,
    );
    rejected(
      await family.client.rpc("exchange_request", {
        ...intro,
        p_body: "Otro cuerpo para el mismo envío",
      }),
      "NONCE_REUSED",
    );
    rejected(
      await family.client.rpc("exchange_send", {
        p_conversation: conversation,
        p_body: "Antes de aceptar",
        p_nonce: randomUUID(),
      }),
      "CONTACT_NOT_ACCEPTED",
    );
    rejected(
      await family.client.rpc("exchange_respond", {
        p_id: conversation,
        p_decision: "accepted",
      }),
      "NOT_FOUND",
    );
    for (const actor of [stranger, moderator]) {
      assert.equal(
        succeeded<unknown[]>(
          await actor.client
            .from("exchange_conversations")
            .select("id")
            .eq("id", conversation),
        ).length,
        0,
      );
      assert.equal(
        succeeded<unknown[]>(
          await actor.client
            .from("exchange_messages")
            .select("id")
            .eq("conversation_id", conversation),
        ).length,
        0,
      );
    }
    succeeded(
      await professional.client.rpc("exchange_respond", {
        p_id: conversation,
        p_decision: "accepted",
      }),
    );
    const message = {
      p_conversation: conversation,
      p_body: "Mensaje sintético enviado una sola vez",
      p_nonce: randomUUID(),
    };
    const concurrentMessages = await Promise.all([
      family.client.rpc("exchange_send", message),
      family.client.rpc("exchange_send", message),
    ]);
    assert.equal(
      succeeded<string>(concurrentMessages[0]),
      succeeded<string>(concurrentMessages[1]),
    );
    assert.equal(
      succeeded<unknown[]>(
        await family.client
          .from("exchange_messages")
          .select("id")
          .eq("conversation_id", conversation)
          .eq("nonce", message.p_nonce),
      ).length,
      1,
    );

    stage = "concurrent edits and stale moderation";
    const version = await currentVersion(
      professional.client,
      "exchange_listings",
      offer,
    );
    const changed = {
      ...listing,
      description:
        "Primera edición sintética que obliga a una nueva revisión del aviso.",
    };
    const concurrentEdits = await Promise.all([
      professional.client.rpc("exchange_save_listing", {
        ...createArgs,
        p_id: offer,
        p_data: changed,
        p_version: version,
      }),
      professional.client.rpc("exchange_save_listing", {
        ...createArgs,
        p_id: offer,
        p_data: {
          ...changed,
          description:
            "Segunda edición sintética concurrente que no debe sobrescribir otra.",
        },
        p_version: version,
      }),
    ]);
    assert.equal(concurrentEdits.filter((result) => !result.error).length, 1);
    rejected(
      concurrentEdits.find((result) => result.error)!,
      "STALE_VERSION",
    );
    rejected(
      await moderator.client.rpc("exchange_moderate", {
        p_kind: "listing",
        p_id: offer,
        p_decision: "approved",
        p_note: "Esta revisión corresponde a una versión anterior",
        p_version: version,
      }),
      "STALE_VERSION",
    );
    await approve(moderator.client, "listing", offer);
    console.log(
      "PASS private inbox permissions, accepted contact and concurrent edits",
    );

    stage = "report boundary and blocking";
    const report = succeeded<string>(
      await family.client.rpc("exchange_report", {
        p_kind: "conversation",
        p_id: conversation,
        p_reason:
          "Reporte sintético para verificar el límite de evidencia visible",
      }),
    );
    const laterBody =
      "Mensaje posterior que no pertenece a la evidencia reportada";
    succeeded(
      await professional.client.rpc("exchange_send", {
        p_conversation: conversation,
        p_body: laterBody,
        p_nonce: randomUUID(),
      }),
    );
    const snapshot = succeeded<unknown[]>(
      await moderator.client
        .from("exchange_reports")
        .select("evidence")
        .eq("id", report),
    );
    assert.equal(snapshot.length, 1);
    assert.equal(JSON.stringify(snapshot).includes(laterBody), false);
    succeeded(
      await family.client.rpc("exchange_block", {
        p_conversation: conversation,
      }),
    );
    rejected(
      await professional.client.rpc("exchange_send", {
        p_conversation: conversation,
        p_body: "Intento bloqueado",
        p_nonce: randomUUID(),
      }),
      "CONTACT_BLOCKED",
    );
    assert.equal(
      succeeded<unknown[]>(
        await family.client.from("exchange_blocks").select("blocker_id"),
      ).length,
      1,
    );

    stage = "deletion request";
    succeeded(await family.client.rpc("exchange_delete_account", {}));
    rejected(
      await family.client.rpc("exchange_enroll", {
        p_adult: true,
        p_notifications: false,
      }),
      "ACCOUNT_DELETING",
    );
    assert.equal(
      succeeded<unknown[]>(
        await moderator.client
          .from("exchange_reports")
          .select("id")
          .eq("id", report),
      ).length,
      1,
    );
    console.log("PASS report snapshots, blocking and deletion request");
    complete = true;
  } catch {
    console.error(
      `FAIL integration stage: ${stage}. Details withheld to protect credentials and session data.`,
    );
    process.exitCode = 1;
  } finally {
    // Recover account IDs even if an admin-create response was lost after commit.
    for (let page = 1; page <= 10; page++) {
      try {
        const found = await admin.auth.admin.listUsers({ page, perPage: 100 });
        if (found.error) {
          cleanupErrors++;
          break;
        }
        for (const user of found.data.users)
          if (user.user_metadata?.exchange_integration_run === runId)
            users.add(user.id);
        if (found.data.users.length < 100) break;
        if (page === 10) cleanupErrors++;
      } catch {
        cleanupErrors++;
        break;
      }
    }
    if (users.size) {
      try {
        const removed = await admin
          .from("exchange_reports")
          .delete()
          .in("reporter_id", [...users]);
        if (removed.error) cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    for (const path of paths) {
      try {
        const removed = await admin.storage.from(BUCKET).remove([path]);
        if (removed.error) cleanupErrors++;
        else if (
          (await admin.rpc("exchange_photo_forget", { p_path: path })).error
        )
          cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    for (const id of users) {
      try {
        if ((await admin.auth.admin.deleteUser(id)).error) cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    if (cleanupErrors) {
      console.error(
        `Cleanup needs review (${cleanupErrors} operations). Synthetic run reference: ${runId}`,
      );
      process.exitCode = 1;
    } else
      console.log(
        "PASS cleanup of synthetic accounts, report snapshots and photos",
      );
    if (complete && !cleanupErrors)
      console.log(
        "PASS integration complete; no OTP, email delivery or notification worker was invoked",
      );
  }
}

void main().catch(() => {
  console.error(
    "Integration did not start: verify the explicit test target and its dedicated environment file. Secrets were not printed.",
  );
  process.exitCode = 1;
});
