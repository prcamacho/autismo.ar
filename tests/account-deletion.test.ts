import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";

test("Auth deletion anonymizes community authorship while keeping verified resources and sources", async () => {
  const db = new PGlite();
  const departing = randomUUID();
  const contributor = randomUUID();
  const moderator = randomUUID();
  const newcomer = randomUUID();
  const source = "https://example.org/fuente-sintetica";
  const fixture = {
    name: "Recurso sintético para verificar eliminación",
    description:
      "Recurso sintético de prueba sin información de personas reales.",
    categoryIds: ["educacion"],
    scope: "local",
    province: "salta",
    locality: "Capital",
    website: "",
    phone: "",
    hours: "",
    coverage: "",
    ageGroups: [],
  };
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for (const id of [departing, contributor, moderator, newcomer])
      await db.query("insert into auth.users values($1)", [id]);
    await applyMigrations(db);
    for (const id of [departing, moderator])
      await db.query(
        "insert into public.community_members values($1,'moderator')",
        [id],
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
    async function publish(author: string, reviewer: string, name: string) {
      await as(author);
      const proposal = await scalar(
        "public.community_submit($1::jsonb,$2,'Nota sintética para publicación',null,0)",
        [JSON.stringify({ ...fixture, name }), source],
      );
      await as(reviewer);
      await scalar(
        "public.community_moderate($1,'reviewing','Revisión de privacidad sintética')",
        [proposal],
      );
      for (const field of [
        "name",
        "location",
        "contact",
        "coverage",
        "ages",
        "description",
      ]) {
        await scalar("public.community_check($1,$2,'matches',$3)", [
          proposal,
          field,
          source,
        ]);
      }
      const resource = await scalar(
        "public.community_moderate($1,'approved','Aprobación de recurso sintético')",
        [proposal],
      );
      return { proposal, resource };
    }
    const own = await publish(departing, moderator, fixture.name);
    const reviewed = await publish(
      contributor,
      departing,
      "Otro recurso sintético con revisión independiente",
    );
    await as(departing);
    await scalar(
      "public.community_report($1,'Reporte sintético presentado por la cuenta saliente')",
      [own.resource],
    );
    await as(contributor);
    await scalar(
      "public.community_report($1,'Reporte sintético que resolverá la cuenta saliente')",
      [reviewed.resource],
    );
    await as(departing);
    const moderatedReport = await scalar(
      "(select id from public.community_reports where resource_id=$1)",
      [reviewed.resource],
    );
    await scalar(
      "public.community_resolve_report($1,'Resolución sintética sin retirar el recurso',false)",
      [moderatedReport],
    );
    // Leaving with an unfinished proposal does not authorize it for publication.
    const pending = await scalar(
      "public.community_submit($1::jsonb,$2,'Propuesta sintética que queda pendiente',null,0)",
      [
        JSON.stringify({
          ...fixture,
          name: "Pendiente sintético de la cuenta saliente",
        }),
        source,
      ],
    );
    await as(moderator);
    await scalar(
      "public.community_moderate($1,'reviewing','Revisión sintética previa al borrado')",
      [pending],
    );
    await as(departing);
    await scalar("public.exchange_enroll(true,false)");
    await scalar("public.exchange_delete_account()");
    await assert.rejects(
      scalar("public.exchange_enroll(true,false)"),
      /ACCOUNT_DELETING/,
    );

    // This is the same database effect requested by Auth Admin's deleteUser.
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [departing]);
    assert.equal(
      await scalar<number>(
        "(select count(*)::integer from auth.users where id=$1)",
        [departing],
      ),
      0,
    );
    assert.equal(
      await scalar<number>(
        "(select count(*)::integer from community_check_events where reviewer_id=$1)",
        [departing],
      ),
      0,
    );
    assert.equal(
      await scalar("(select author_id from community_proposals where id=$1)", [
        own.proposal,
      ]),
      null,
    );
    assert.equal(
      await scalar(
        "(select moderated_by from community_proposals where id=$1)",
        [reviewed.proposal],
      ),
      null,
    );
    const checks = (
      await db.query<{ reviewer_id: string | null; source_url: string }>(
        "select reviewer_id,source_url from community_checks where proposal_id=$1",
        [reviewed.proposal],
      )
    ).rows;
    assert.equal(checks.length, 6);
    assert.ok(
      checks.every(
        (check) => check.reviewer_id === null && check.source_url === source,
      ),
    );
    assert.equal(
      await scalar(
        "(select author_id from community_reports where resource_id=$1)",
        [own.resource],
      ),
      null,
    );
    assert.equal(
      await scalar("(select moderated_by from community_reports where id=$1)", [
        moderatedReport,
      ]),
      null,
    );
    assert.equal(
      await scalar("(select author_id from community_proposals where id=$1)", [
        reviewed.proposal,
      ]),
      contributor,
    );

    await as(null, "anon");
    const published = (
      await db.query<{ id: string; source_url: string }>(
        "select id,source_url from resources order by id",
      )
    ).rows;
    assert.equal(published.length, 2);
    assert.ok(published.every((resource) => resource.source_url === source));
    assert.equal(
      (await db.query("select * from resource_revisions")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select * from resource_confirmations")).rows.length,
      12,
    );
    await as(newcomer);
    assert.deepEqual(
      (await db.query("select * from community_reports")).rows,
      [],
    );
    assert.equal(
      (
        await db.query("select * from community_proposals where id=$1", [
          own.proposal,
        ])
      ).rows.length,
      0,
    );
    await as(moderator);
    for (const field of [
      "name",
      "location",
      "contact",
      "coverage",
      "ages",
      "description",
    ]) {
      await scalar("public.community_check($1,$2,'matches',$3)", [
        pending,
        field,
        source,
      ]);
    }
    await assert.rejects(
      scalar(
        "public.community_moderate($1,'approved','No se debe publicar un aporte sin autor vigente')",
        [pending],
      ),
      /MISSING_CHECKS/,
    );
  } finally {
    await db.close();
  }
});
