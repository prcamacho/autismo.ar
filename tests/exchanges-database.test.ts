import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";
import type { ProfileData, ListingData } from "../src/features/exchanges/model";

const professional = "71000000-0000-4000-8000-000000000001";
const family = "71000000-0000-4000-8000-000000000002";
const outsider = "71000000-0000-4000-8000-000000000003";
const moderator = "71000000-0000-4000-8000-000000000004";
const ids = [professional, family, outsider, moderator];
let nonceIndex = 0;
const nonce = () =>
  `72000000-0000-4000-8000-${String(++nonceIndex).padStart(12, "0")}`;
const profile: ProfileData = {
  name: "Perfil sintético de prueba",
  title: "Formación declarada de prueba",
  institution: "Institución sintética",
  graduationYear: 2015,
  registration: "",
  experienceYears: 4,
  description:
    "Descripción sintética utilizada solamente para verificar permisos.",
  ageGroups: ["Infancia"],
  photoPath: null,
};

test("exchanges protect publications, private contact, quotas, moderation and deletion", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for (const id of ids)
      await db.query("insert into auth.users values($1)", [id]);
    await applyMigrations(db);
    await db.query(
      "insert into public.community_members values($1,'moderator')",
      [moderator],
    );
    const places = (
      await db.query<{ id: string }>(
        "select id from public.exchange_places where province='buenos-aires' order by id limit 2",
      )
    ).rows.map((p) => p.id);
    assert.equal(places.length, 2, "official locations seed must be available");
    const listing: ListingData = {
      title: "Aviso sintético para probar ubicaciones",
      service: "inclusion-escolar",
      role: "Apoyo a la inclusión escolar",
      description:
        "Esta publicación sintética permite comprobar reglas sin datos personales reales.",
      modality: "presencial",
      days: ["lunes"],
      shifts: ["manana"],
      startDate: "",
      availability: "available",
      engagement: "A convenir",
      ageGroups: ["Infancia"],
      locationIds: places,
      receiveRequests: true,
    };
    async function as(user: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        user ?? "",
      ]);
      await db.exec(`set role ${role}`);
    }
    async function scalar<T = string>(sql: string, params: unknown[] = []) {
      return (await db.query<{ value: T }>(`select ${sql} as value`, params))
        .rows[0].value;
    }
    async function save(
      kind: "offer" | "request",
      data = listing,
      id: string | null = null,
      version = 0,
      creationNonce = nonce(),
    ) {
      return scalar("public.exchange_save_listing($1,$2,$3::jsonb,$4,$5)", [
        id,
        kind,
        JSON.stringify(data),
        version,
        creationNonce,
      ]);
    }
    async function approve(kind: "profile" | "listing", id: string) {
      await as(moderator);
      const table =
        kind === "profile" ? "exchange_profiles" : "exchange_listings";
      const version = (
        await db.query<{ version: number }>(
          `select version from public.${table} where id=$1`,
          [id],
        )
      ).rows[0].version;
      await scalar(
        "public.exchange_moderate($1,$2,'approved','Revisión sintética del contenido',$3)",
        [kind, id, version],
      );
    }
    async function search(kind = "", place = "") {
      return db.query<{
        id: string;
        owner: boolean;
        review_note: string | null;
      }>("select * from public.exchange_search($1,'','buenos-aires',$2,1)", [
        kind,
        place,
      ]);
    }
    let profileId = "";
    let offerId = "";
    let requestId = "";
    let conversation = "";
    let reportId = "";

    await t.test(
      "requires adult acknowledgement and never trusts client identity or arbitrary fields",
      async () => {
        await as(null, "anon");
        await assert.rejects(
          scalar("public.exchange_enroll(true,false)"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.exchange_profiles"),
          /permission denied/,
        );
        await as(professional);
        await assert.rejects(save("offer"), /ADULT_REQUIRED/);
        await assert.rejects(
          scalar("public.exchange_enroll(false,false)"),
          /ADULT_REQUIRED/,
        );
        for (const id of ids) {
          await as(id);
          await scalar("public.exchange_enroll(true,true)");
        }
        await as(professional);
        await assert.rejects(
          scalar("public.exchange_save_profile($1::jsonb,true,0)", [
            JSON.stringify({ ...profile, secret: "forbidden" }),
          ]),
          /INVALID_INPUT/,
        );
        await assert.rejects(
          scalar("public.exchange_save_profile($1::jsonb,true,0)", [
            JSON.stringify({
              ...profile,
              description: "Contacto público indebido: prueba@example.org",
            }),
          ]),
          /INVALID_INPUT/,
        );
        await assert.rejects(
          scalar("public.exchange_save_profile($1::jsonb,true,0)", [
            JSON.stringify({
              ...profile,
              photoPath: `${family}/${nonce()}.webp`,
            }),
          ]),
          /INVALID_PHOTO/,
        );
        profileId = await scalar(
          "public.exchange_save_profile($1::jsonb,true,0)",
          [JSON.stringify(profile)],
        );
        await assert.rejects(
          db.query("update public.exchange_profiles set status='approved'"),
          /permission denied/,
        );
        await assert.rejects(
          scalar("public.exchange_save_profile($1::jsonb,true,0)", [
            JSON.stringify(profile),
          ]),
          /STALE_VERSION/,
        );
        await as(outsider);
        assert.equal(
          (await db.query("select * from public.exchange_profiles")).rows
            .length,
          0,
        );
        assert.equal(
          (
            await db.query("select * from public.exchange_profile($1)", [
              profileId,
            ])
          ).rows.length,
          0,
        );
      },
    );

    await t.test(
      "publishes one listing across multiple places and keeps family requests behind authentication",
      async () => {
        await as(professional);
        await assert.rejects(
          save("offer", { ...listing, locationIds: [places[0], places[0]] }),
          /INVALID_INPUT/,
        );
        await assert.rejects(
          save("offer", { ...listing, locationIds: ["nonexistent-place"] }),
          /INVALID_LOCATION/,
        );
        await assert.rejects(
          save("offer", { ...listing, days: [] }),
          /INVALID_INPUT/,
        );
        await assert.rejects(
          save("offer", {
            ...listing,
            description: "Contacto público indebido: +54 11 5555 5555",
          }),
          /INVALID_INPUT/,
        );
        const creationNonce = nonce();
        offerId = await save("offer", listing, null, 0, creationNonce);
        assert.equal(
          await save("offer", listing, null, 0, creationNonce),
          offerId,
        );
        await assert.rejects(
          save(
            "offer",
            { ...listing, description: "Otro texto para el mismo envío" },
            null,
            0,
            creationNonce,
          ),
          /NONCE_REUSED/,
        );
        await as(moderator);
        await assert.rejects(
          scalar(
            "public.exchange_moderate('listing',$1,'approved','Revisión de prueba válida',1)",
            [offerId],
          ),
          /PROFILE_REVIEW_REQUIRED/,
        );
        await approve("profile", profileId);
        await approve("listing", offerId);
        await as(family);
        requestId = await save("request", {
          ...listing,
          title: "Búsqueda sintética de un apoyo profesional",
        });
        await approve("listing", requestId);
        await as(null, "anon");
        const publicRows = (await search()).rows;
        assert.deepEqual(
          publicRows.map((r) => r.id),
          [offerId],
        );
        assert.equal(publicRows[0].review_note, null);
        assert.equal((await search("offer", places[0])).rows.length, 1);
        assert.equal((await search("offer", places[1])).rows.length, 1);
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_search('offer','','','',1,'virtual','available')",
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_search('offer','','','',1,'presencial','available')",
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_search('offer','','','',1,'presencial','limited')",
            )
          ).rows.length,
          0,
        );
        await db.exec("reset role");
        await db.query(
          "update public.exchange_listings set data=jsonb_set(data,'{availability}','\"unavailable\"') where id=$1",
          [offerId],
        );
        await as(null, "anon");
        assert.equal((await search("offer")).rows.length, 0);
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_search('offer','','','',1,'','unavailable')",
            )
          ).rows.length,
          1,
        );
        await as(outsider);
        await assert.rejects(
          scalar(
            "public.exchange_request($1,'Solicitud sin disponibilidad',$2)",
            [offerId, nonce()],
          ),
          /LISTING_UNAVAILABLE/,
        );
        await db.exec("reset role");
        await db.query(
          "update public.exchange_listings set data=jsonb_set(data,'{availability}','\"available\"') where id=$1",
          [offerId],
        );
        await as(null, "anon");
        assert.equal(
          (
            await db.query("select * from public.exchange_listing($1)", [
              requestId,
            ])
          ).rows.length,
          0,
        );
        await as(outsider);
        assert.equal((await search()).rows.length, 2);
        const request = (
          await db.query<Record<string, unknown>>(
            "select * from public.exchange_listing($1)",
            [requestId],
          )
        ).rows[0];
        assert.equal("user_id" in request, false);
        assert.equal(request.review_note, null);
        await assert.rejects(
          save("request", listing, requestId, 2),
          /NOT_FOUND/,
        );
      },
    );

    await t.test(
      "contact requires acceptance, supports idempotency and does not grant moderators inbox access",
      async () => {
        await as(family);
        const contactNonce = nonce();
        conversation = await scalar(
          "public.exchange_request($1,'Presentación sintética privada',$2)",
          [offerId, contactNonce],
        );
        assert.equal(
          await scalar(
            "public.exchange_request($1,'Presentación sintética privada',$2)",
            [offerId, contactNonce],
          ),
          conversation,
        );
        await assert.rejects(
          scalar("public.exchange_request($1,'Presentación modificada',$2)", [
            offerId,
            contactNonce,
          ]),
          /NONCE_REUSED/,
        );
        await assert.rejects(
          scalar("public.exchange_request($1,'Otro intento',$2)", [
            offerId,
            nonce(),
          ]),
          /CONTACT_EXISTS/,
        );
        await assert.rejects(
          scalar("public.exchange_send($1,'Aún no aceptado',$2)", [
            conversation,
            nonce(),
          ]),
          /CONTACT_NOT_ACCEPTED/,
        );
        await assert.rejects(
          scalar("public.exchange_respond($1,'accepted')", [conversation]),
          /NOT_FOUND/,
        );
        for (const id of [outsider, moderator]) {
          await as(id);
          assert.equal(
            (await db.query("select * from public.exchange_conversations")).rows
              .length,
            0,
          );
          assert.equal(
            (await db.query("select * from public.exchange_messages")).rows
              .length,
            0,
          );
          await assert.rejects(
            scalar("public.exchange_send($1,'Intrusión',$2)", [
              conversation,
              nonce(),
            ]),
            /NOT_FOUND/,
          );
        }
        await as(professional);
        await scalar("public.exchange_respond($1,'accepted')", [conversation]);
        await as(family);
        const messageNonce = nonce();
        const message = await scalar(
          "public.exchange_send($1,'Mensaje sintético aceptado',$2)",
          [conversation, messageNonce],
        );
        assert.equal(
          await scalar(
            "public.exchange_send($1,'Mensaje sintético aceptado',$2)",
            [conversation, messageNonce],
          ),
          message,
        );
        await assert.rejects(
          scalar("public.exchange_send($1,'Cuerpo distinto',$2)", [
            conversation,
            messageNonce,
          ]),
          /NONCE_REUSED/,
        );
        assert.equal(
          (await db.query("select * from public.exchange_messages")).rows
            .length,
          2,
        );
        await as(null, "anon");
        await assert.rejects(
          scalar("public.exchange_send($1,'Sin cuenta',$2)", [
            conversation,
            nonce(),
          ]),
          /permission denied/,
        );
      },
    );

    await t.test(
      "an expired listing stops new requests but accepted conversations remain usable",
      async () => {
        await db.exec("reset role");
        await db.query(
          "update public.exchange_listings set expires_at=now()-interval '1 day' where id=$1",
          [offerId],
        );
        await as(outsider);
        await assert.rejects(
          scalar("public.exchange_request($1,'Presentación tardía',$2)", [
            offerId,
            nonce(),
          ]),
          /LISTING_UNAVAILABLE/,
        );
        await as(family);
        await scalar(
          "public.exchange_send($1,'Podemos continuar una conversación aceptada',$2)",
          [conversation, nonce()],
        );
        await as(professional);
        await scalar("public.exchange_listing_state($1,'renew')", [offerId]);
        const current = (
          await db.query<{ version: number }>(
            "select version from public.exchange_listings where id=$1",
            [offerId],
          )
        ).rows[0].version;
        await save("offer", { ...listing, days: ["martes"] }, offerId, current);
        assert.equal(
          await scalar(
            "(select status from public.exchange_listings where id=$1)",
            [offerId],
          ),
          "published",
        );
        await save(
          "offer",
          {
            ...listing,
            description:
              "Contenido modificado que requiere una nueva revisión de privacidad.",
          },
          offerId,
          current + 1,
        );
        assert.equal(
          await scalar(
            "(select status from public.exchange_listings where id=$1)",
            [offerId],
          ),
          "pending",
        );
        await assert.rejects(
          scalar("public.exchange_listing_state($1,'paused')", [offerId]),
          /REVIEW_REQUIRED/,
        );
        await assert.rejects(
          scalar("public.exchange_listing_state($1,'renew')", [offerId]),
          /REVIEW_REQUIRED/,
        );
        await as(moderator);
        await assert.rejects(
          scalar(
            "public.exchange_moderate('listing',$1,'approved','La versión leída ya cambió',$2)",
            [offerId, current],
          ),
          /STALE_VERSION/,
        );
        await approve("listing", offerId);
      },
    );

    await t.test(
      "blocking stops messages and new contacts across listings, reports reveal only submitted evidence",
      async () => {
        await as(family);
        reportId = await scalar(
          "public.exchange_report('conversation',$1,'Reporte sintético para comprobar acceso restringido')",
          [conversation],
        );
        await scalar("public.exchange_block($1)", [conversation]);
        for (const id of [family, professional]) {
          await as(id);
          assert.equal(
            (await db.query("select * from public.exchange_blocks")).rows
              .length,
            1,
          );
          await assert.rejects(
            scalar("public.exchange_send($1,'Mensaje bloqueado',$2)", [
              conversation,
              nonce(),
            ]),
            /CONTACT_BLOCKED/,
          );
        }
        await as(professional);
        const otherOffer = await save("offer", {
          ...listing,
          title: "Otro aviso sintético para probar bloqueo",
        });
        await approve("listing", otherOffer);
        await as(family);
        await assert.rejects(
          scalar("public.exchange_request($1,'Intento en otro aviso',$2)", [
            otherOffer,
            nonce(),
          ]),
          /CONTACT_BLOCKED/,
        );
        await as(outsider);
        assert.equal(
          (await db.query("select * from public.exchange_reports")).rows.length,
          0,
        );
        await assert.rejects(
          scalar(
            "public.exchange_report('conversation',$1,'Reporte sin participación en la conversación')",
            [conversation],
          ),
          /NOT_FOUND/,
        );
        await as(moderator);
        const reports = await db.query<{ evidence: { messages: unknown[] } }>(
          "select evidence from public.exchange_reports where id=$1",
          [reportId],
        );
        assert.equal(reports.rows[0].evidence.messages.length, 3);
        assert.equal(
          (await db.query("select * from public.exchange_messages")).rows
            .length,
          0,
        );
      },
    );

    await t.test(
      "request quotas are enforced in SQL and maintenance is never callable by users",
      async () => {
        const targets: string[] = [];
        for (let index = 0; index < 6; index++) {
          await as(professional);
          const id = await save("offer", {
            ...listing,
            title: `Oferta sintética de prueba número ${index}`,
          });
          await approve("listing", id);
          targets.push(id);
        }
        await as(outsider);
        for (let index = 0; index < 5; index++)
          await scalar(
            "public.exchange_request($1,'Contacto sintético de cuota',$2)",
            [targets[index], nonce()],
          );
        await assert.rejects(
          scalar("public.exchange_request($1,'Supera la cuota diaria',$2)", [
            targets[5],
            nonce(),
          ]),
          /RATE_LIMIT/,
        );
        await assert.rejects(
          db.query("select * from public.exchange_maintenance()"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.exchange_claim_notifications(10,10)"),
          /permission denied/,
        );
        await assert.rejects(
          scalar(
            "public.exchange_rate($1,'request',99999,interval '1 second')",
            [outsider],
          ),
          /permission denied/,
        );
        for (let index = 0; index < 5; index++)
          await scalar("public.exchange_reserve_photo()");
        await assert.rejects(
          scalar("public.exchange_reserve_photo()"),
          /RATE_LIMIT/,
        );
      },
    );

    await t.test(
      "notifications group per recipient, reserve a budget and retry with the same delivery key",
      async () => {
        await as(null, "service_role");
        type Delivery = { id: string; token: string };
        const claimed = (
          await db.query<Delivery>(
            "select * from public.exchange_claim_notifications(10,1)",
          )
        ).rows;
        assert.equal(claimed.length, 1);
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_claim_notifications(10,1)",
            )
          ).rows.length,
          0,
        );
        await scalar("public.exchange_finish_notification($1,$2,false)", [
          claimed[0].id,
          claimed[0].token,
        ]);
        await db.query(
          "update public.exchange_notifications set available_at=now()-interval '1 minute' where id=$1",
          [claimed[0].id],
        );
        const retried = (
          await db.query<Delivery>(
            "select * from public.exchange_claim_notifications(1,10)",
          )
        ).rows;
        assert.equal(retried[0].id, claimed[0].id);
        assert.equal(retried[0].token, claimed[0].token);
        await scalar("public.exchange_finish_notification($1,$2,true)", [
          retried[0].id,
          retried[0].token,
        ]);
        assert.equal(
          await scalar(
            "(select status from public.exchange_notifications where id=$1)",
            [retried[0].id],
          ),
          "sent",
        );
        assert.equal(
          await scalar<number>(
            "(select count(*)::integer from public.exchange_delivery_events where token=$1)",
            [retried[0].token],
          ),
          2,
          "each attempt conservatively reserves budget even with an unchanged provider idempotency key",
        );
      },
    );

    await t.test(
      "an uncertain email is never retried beyond its idempotency window",
      async () => {
        await as(null, "service_role");
        await scalar("public.exchange_queue($1,'activity')", [outsider]);
        const notifications = (
          await db.query<{ id: string; token: string }>(
            "select * from public.exchange_claim_notifications(100,100)",
          )
        ).rows;
        assert.ok(notifications.length > 0);
        const uncertain = notifications[0];
        await db.query(
          "update public.exchange_delivery_events set created_at=now()-interval '23 hours 1 minute' where token=$1",
          [uncertain.token],
        );
        await db.query(
          "update public.exchange_notifications set claimed_at=now()-interval '16 minutes' where id=$1",
          [uncertain.id],
        );
        const retry = (
          await db.query<{ id: string }>(
            "select * from public.exchange_claim_notifications(100,100)",
          )
        ).rows;
        assert.equal(
          retry.some((item) => item.id === uncertain.id),
          false,
        );
        assert.equal(
          await scalar(
            "(select status from public.exchange_notifications where id=$1)",
            [uncertain.id],
          ),
          "failed",
        );
        await scalar("public.exchange_queue($1,'activity')", [outsider]);
        await db.query(
          "select * from public.exchange_claim_notifications(100,100)",
        );
        assert.equal(
          await scalar(
            "(select count(*)::integer from public.exchange_delivery_events where token=$1)",
            [uncertain.token],
          ),
          1,
        );
      },
    );

    await t.test(
      "retention warns before deletion and reported evidence remains separate",
      async () => {
        await as(null, "service_role");
        await db.query(
          "update public.exchange_conversations set updated_at=now()-interval '100 days' where id=$1",
          [conversation],
        );
        await db.query("select * from public.exchange_maintenance()");
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_conversations where id=$1",
              [conversation],
            )
          ).rows.length,
          1,
        );
        await db.query(
          "update public.exchange_conversations set deletion_warning_at=now()-interval '8 days' where id=$1",
          [conversation],
        );
        await db.query("select * from public.exchange_maintenance()");
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_conversations where id=$1",
              [conversation],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_messages where conversation_id=$1",
              [conversation],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "select * from public.exchange_reports where id=$1",
              [reportId],
            )
          ).rows.length,
          1,
        );
        await as(moderator);
        await scalar(
          "public.exchange_resolve_report($1,'Cierre sintético del reporte revisado',false)",
          [reportId],
        );
      },
    );

    await t.test(
      "account deletion removes publications and prevents recreation before Auth deletion",
      async () => {
        await as(family);
        await scalar("public.exchange_delete_account()");
        await assert.rejects(
          scalar("public.exchange_enroll(true,false)"),
          /ACCOUNT_DELETING/,
        );
        await assert.rejects(save("request"), /ACCOUNT_DELETING/);
        assert.equal(
          (await db.query("select * from public.exchange_listings")).rows
            .length,
          0,
        );
        await db.exec("reset role");
        await db.query("delete from auth.users where id=$1", [family]);
        const kept = (
          await db.query<{ reporter_id: string | null }>(
            "select reporter_id from public.exchange_reports where id=$1",
            [reportId],
          )
        ).rows;
        assert.equal(kept.length, 1);
        assert.equal(kept[0].reporter_id, null);
      },
    );
  } finally {
    await db.close();
  }
});
