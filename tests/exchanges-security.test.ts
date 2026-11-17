import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";
import type { ListingData, ProfileData } from "../src/features/exchanges/model";

test("adversarial exchange access, photo visibility and private report boundaries", async (t) => {
  const db = new PGlite();
  const owner = randomUUID();
  const family = randomUUID();
  const stranger = randomUUID();
  const moderator = randomUUID();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for (const id of [owner, family, stranger, moderator])
      await db.query("insert into auth.users values($1)", [id]);
    await applyMigrations(db);
    await db.query(
      "insert into public.community_members values($1,'moderator')",
      [moderator],
    );
    async function as(user: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        user ?? "",
      ]);
      await db.exec(`set role ${role}`);
    }
    async function scalar<T = string>(sql: string, values: unknown[] = []) {
      return (await db.query<{ value: T }>(`select ${sql} as value`, values))
        .rows[0].value;
    }
    for (const id of [owner, family, stranger, moderator]) {
      await as(id);
      await scalar("public.exchange_enroll(true,false)");
    }
    const profile: ProfileData = {
      name: "Perfil de prueba de permisos",
      title: "Formación sintética",
      institution: "",
      graduationYear: null,
      registration: "",
      experienceYears: 0,
      description:
        "Presentación sintética para verificar la privacidad de las fotografías.",
      ageGroups: [],
      photoPath: `${owner}/${randomUUID()}.webp`,
    };
    let profileId = "";
    let requestId = "";
    let conversation = "";
    async function photoRows(viewer: string | null) {
      await as(null, "service_role");
      return (
        await db.query<{ path: string }>(
          "select * from public.exchange_photo_access($1,$2)",
          [profileId, viewer],
        )
      ).rows;
    }

    await t.test(
      "photo paths are unavailable until publication and disappear on privacy or review changes",
      async () => {
        await as(owner);
        profileId = await scalar(
          "public.exchange_save_profile($1::jsonb,true,0)",
          [JSON.stringify(profile)],
        );
        for (const user of [stranger, owner, moderator, null]) {
          await as(user, user ? "authenticated" : "anon");
          await assert.rejects(
            db.query("select * from public.exchange_photo_access($1,$2)", [
              profileId,
              owner,
            ]),
            /permission denied/,
          );
        }
        assert.deepEqual(await photoRows(stranger), []);
        assert.deepEqual(await photoRows(null), []);
        assert.equal((await photoRows(owner))[0].path, profile.photoPath);
        assert.equal((await photoRows(moderator))[0].path, profile.photoPath);
        await as(moderator);
        await scalar(
          "public.exchange_moderate('profile',$1,'approved','Revisión sintética inicial',1)",
          [profileId],
        );
        assert.equal((await photoRows(null)).length, 1);
        await as(null, "anon");
        const publicProfile = (
          await db.query<{ data: Record<string, unknown> }>(
            "select * from public.exchange_profile($1)",
            [profileId],
          )
        ).rows[0];
        assert.equal(publicProfile.data.hasPhoto, true);
        assert.equal("photoPath" in publicProfile.data, false);
        assert.ok(!JSON.stringify(publicProfile).includes(owner));
        await as(owner);
        await scalar("public.exchange_save_profile($1::jsonb,false,2)", [
          JSON.stringify(profile),
        ]);
        assert.equal((await photoRows(null)).length, 0);
        await as(owner);
        await scalar("public.exchange_save_profile($1::jsonb,true,3)", [
          JSON.stringify(profile),
        ]);
        await scalar("public.exchange_save_profile($1::jsonb,true,4)", [
          JSON.stringify({
            ...profile,
            description:
              "Presentación cambiada: necesita otra revisión antes de mostrarse públicamente.",
          }),
        ]);
        assert.equal((await photoRows(stranger)).length, 0);
        await as(stranger);
        await assert.rejects(
          scalar("public.exchange_save_profile($1::jsonb,true,0)", [
            JSON.stringify(profile),
          ]),
          /INVALID_PHOTO/,
        );
        await as(moderator);
        await scalar(
          "public.exchange_moderate('profile',$1,'rejected','La revisión sintética requiere cambios',5)",
          [profileId],
        );
        assert.equal((await photoRows(null)).length, 0);
      },
    );

    await t.test(
      "private worker and authorization helpers cannot be called by a normal account",
      async () => {
        await as(stranger);
        for (const expression of [
          "public.exchange_maintenance()",
          "public.exchange_claim_notifications(10,100)",
          `public.exchange_is_blocked('${owner}','${family}')`,
          `public.exchange_pair_lock('${owner}','${family}')`,
          `public.exchange_rate('${owner}','request',1,interval '1 day')`,
          `public.exchange_queue('${owner}','activity')`,
        ])
          await assert.rejects(scalar(expression), /permission denied/);
        await assert.rejects(
          db.query("select * from public.exchange_notifications"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.exchange_events"),
          /permission denied/,
        );
      },
    );

    await t.test(
      "request retry cannot report a changed introduction as saved",
      async () => {
        await as(family);
        const place = (
          await db.query<{ id: string }>(
            "select id from public.exchange_places order by id limit 1",
          )
        ).rows[0].id;
        const listing: ListingData = {
          title: "Búsqueda sintética privada",
          service: "inclusion-escolar",
          role: "Apoyo escolar",
          description:
            "Búsqueda sintética de pruebas, sin información de ninguna persona real.",
          modality: "presencial",
          days: ["lunes"],
          shifts: ["manana"],
          startDate: "",
          availability: "available",
          engagement: "",
          ageGroups: [],
          locationIds: [place],
          receiveRequests: true,
        };
        requestId = await scalar(
          "public.exchange_save_listing(null,'request',$1::jsonb,0,$2)",
          [JSON.stringify(listing), randomUUID()],
        );
        await as(moderator);
        await scalar(
          "public.exchange_moderate('listing',$1,'approved','Revisión de una búsqueda sintética',1)",
          [requestId],
        );
        await as(owner);
        const nonce = randomUUID();
        conversation = await scalar(
          "public.exchange_request($1,'Primera presentación sintética',$2)",
          [requestId, nonce],
        );
        assert.equal(
          await scalar(
            "public.exchange_request($1,'Primera presentación sintética',$2)",
            [requestId, nonce],
          ),
          conversation,
        );
        await assert.rejects(
          scalar(
            "public.exchange_request($1,'Presentación diferente que no debe aparentar guardarse',$2)",
            [requestId, nonce],
          ),
          /NONCE_REUSED/,
        );
      },
    );

    await t.test(
      "reporting exposes a bounded snapshot, not later inbox messages",
      async () => {
        await as(family);
        await scalar("public.exchange_respond($1,'accepted')", [conversation]);
        const reportId = await scalar(
          "public.exchange_report('conversation',$1,'Reporte sintético para comprobar el límite de acceso')",
          [conversation],
        );
        await as(owner);
        await scalar(
          "public.exchange_send($1,'Mensaje posterior al reporte que permanece privado',$2)",
          [conversation, randomUUID()],
        );
        await as(moderator);
        const report = (
          await db.query<{ evidence: { messages: { body: string }[] } }>(
            "select evidence from public.exchange_reports where id=$1",
            [reportId],
          )
        ).rows[0];
        assert.equal(report.evidence.messages.length, 1);
        assert.equal(
          report.evidence.messages[0].body,
          "Primera presentación sintética",
        );
        assert.deepEqual(
          (await db.query("select * from public.exchange_messages")).rows,
          [],
        );
        await assert.rejects(
          scalar(
            "public.exchange_report('conversation',$1,'Un moderador no puede inspeccionar la conversación completa')",
            [conversation],
          ),
          /NOT_FOUND/,
        );
        await as(stranger);
        assert.deepEqual(
          (await db.query("select * from public.exchange_reports")).rows,
          [],
        );
        assert.deepEqual(
          (await db.query("select * from public.exchange_conversations")).rows,
          [],
        );
      },
    );
  } finally {
    await db.close();
  }
});
