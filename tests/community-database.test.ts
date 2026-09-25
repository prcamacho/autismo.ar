import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Synthetic records only. A real PostgreSQL engine exercises RPCs and RLS.
const author = "10000000-0000-4000-8000-000000000001";
const reviewer = "10000000-0000-4000-8000-000000000002";
const moderator = "10000000-0000-4000-8000-000000000003";
const fixture = {
  name: "Recurso sintético de prueba",
  description: "Descripción sintética para comprobar permisos y revisiones.",
  categoryIds: ["profesionales"],
  scope: "local",
  province: "salta",
  locality: "Capital",
  website: "",
  phone: "",
  hours: "",
  coverage: "",
  ageGroups: [],
};

test("community permissions, independent review, revisions, conflicts and privacy", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon,authenticated;
      insert into auth.users values ('${author}'),('${reviewer}'),('${moderator}');`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609240001_community.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.query(
      "insert into public.community_members values ($1,'moderator')",
      [moderator],
    );
    async function as(id: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id || "",
      ]);
      await db.exec(`set role ${role}`);
    }
    async function submit(
      data = fixture,
      resource: string | null = null,
      version = 0,
    ) {
      return (
        await db.query<{ id: string }>(
          "select public.community_submit($1::jsonb,'https://example.org/source','Fuente sintética para pruebas',$2,$3) as id",
          [JSON.stringify(data), resource, version],
        )
      ).rows[0].id;
    }
    async function moderate(id: string, decision: string) {
      return (
        await db.query<{ id: string }>(
          "select public.community_moderate($1,$2,'Revisión sintética de prueba') as id",
          [id, decision],
        )
      ).rows[0].id;
    }
    async function check(id: string, field: string, verdict = "matches") {
      await db.query(
        "select public.community_check($1,$2,$3,'https://example.org/check')",
        [id, field, verdict],
      );
    }

    await as(null, "anon");
    assert.equal(
      (await db.query("select * from public.resources")).rows.length,
      0,
    );
    await assert.rejects(submit(), /permission denied/);
    await assert.rejects(
      db.query("select * from public.community_proposals"),
      /permission denied/,
    );
    await as(author);
    await assert.rejects(
      submit({ ...fixture, website: "javascript:alert(1)" }),
      /check constraint/,
    );
    await assert.rejects(
      submit({ ...fixture, province: "invalid" }),
      /check constraint/,
    );
    await assert.rejects(
      submit({ ...fixture, privateMedicalNote: "forbidden" } as typeof fixture),
      /check constraint/,
    );
    const proposal = await submit();
    await assert.rejects(submit(), /DUPLICATE_PROPOSAL/);
    await assert.rejects(
      db.query("update public.community_proposals set status='approved'"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("insert into public.community_members values ($1,'moderator')", [
        author,
      ]),
      /permission denied/,
    );
    await assert.rejects(moderate(proposal, "approved"), /MODERATOR_REQUIRED/);
    await as(reviewer);
    assert.equal(
      (await db.query("select * from public.community_proposals")).rows.length,
      0,
      "unmoderated submissions are private",
    );
    await assert.rejects(check(proposal, "name"), /NOT_REVIEWABLE/);
    await as(moderator);
    await moderate(proposal, "reviewing");
    await assert.rejects(
      db.query(
        "select public.community_moderate($1,null,'Decisión nula de prueba')",
        [proposal],
      ),
      /INVALID_TRANSITION/,
    );
    await assert.rejects(moderate(proposal, "approved"), /MISSING_CHECKS/);
    await as(author);
    await assert.rejects(check(proposal, "name"), /SELF_REVIEW/);
    await as(reviewer);
    for (const f of ["name", "location", "description"])
      await check(proposal, f);
    await check(proposal, "contact", "disagrees");
    await as(moderator);
    await assert.rejects(
      moderate(proposal, "approved"),
      /UNRESOLVED_DISAGREEMENT/,
    );
    await as(reviewer);
    await check(proposal, "contact");
    await as(moderator);
    const resource = await moderate(proposal, "approved");
    await assert.rejects(moderate(proposal, "approved"), /NOT_REVIEWABLE/);
    await as(null, "anon");
    assert.equal(
      (await db.query("select * from public.resources")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.resource_revisions")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select * from public.community_search('sintetico','','salta','Capital')",
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select * from public.community_search('','','cordoba','Capital')",
        )
      ).rows.length,
      0,
    );
    await as(author);
    const changed = { ...fixture, coverage: "Cobertura sintética" };
    const correction = await submit(changed, resource, 1);
    const concurrent = await submit(
      { ...fixture, hours: "Horario sintético" },
      resource,
      1,
    );
    await as(moderator);
    await moderate(correction, "reviewing");
    await moderate(concurrent, "reviewing");
    await as(reviewer);
    await check(correction, "coverage");
    await check(concurrent, "contact");
    await as(moderator);
    await moderate(correction, "approved");
    await assert.rejects(moderate(concurrent, "approved"), /STALE_VERSION/);
    await as(author);
    await assert.rejects(submit(fixture, resource, 1), /STALE_VERSION/);
    const restore = await submit(fixture, resource, 2);
    await as(moderator);
    await moderate(restore, "reviewing");
    await as(reviewer);
    await check(restore, "coverage");
    await as(moderator);
    await moderate(restore, "approved");
    assert.equal(
      (
        await db.query<{ version: number }>(
          "select version from public.resources",
        )
      ).rows[0].version,
      3,
    );
    assert.equal(
      (await db.query("select * from public.resource_revisions")).rows.length,
      3,
    );
    await as(author);
    const duplicate = await submit(fixture);
    await as(moderator);
    await moderate(duplicate, "reviewing");
    await as(reviewer);
    for (const f of ["name", "location", "description"])
      await check(duplicate, f);
    await as(moderator);
    await assert.rejects(moderate(duplicate, "approved"), /resources_identity/);
    await db.exec("reset role");
    await db.query(
      "insert into public.community_check_events(reviewer_id) select $1 from generate_series(1,40)",
      [reviewer],
    );
    await as(reviewer);
    await assert.rejects(check(duplicate, "name"), /RATE_LIMIT/);
    await assert.rejects(
      db.query("delete from public.community_check_events"),
      /permission denied/,
    );
    await as(author);
    await db.query(
      "select public.community_report($1,'Reporte sintético de privacidad')",
      [resource],
    );
    const report = (
      await db.query<{ id: string }>("select id from public.community_reports")
    ).rows[0].id;
    await as(reviewer);
    assert.equal(
      (await db.query("select * from public.community_reports")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "select public.community_resolve_report($1,'Intento sin permisos',true)",
        [report],
      ),
      /MODERATOR_REQUIRED/,
    );
    await as(moderator);
    await db.query(
      "select public.community_resolve_report($1,'Ocultado por privacidad en prueba',true)",
      [report],
    );
    await as(null, "anon");
    for (const table of [
      "resources",
      "resource_revisions",
      "resource_confirmations",
    ])
      assert.equal(
        (await db.query(`select * from public.${table}`)).rows.length,
        0,
        "hidden resource and history must not leak",
      );
    await as(reviewer);
    assert.equal(
      (
        await db.query(
          "select * from public.community_proposals where resource_id = $1",
          [resource],
        )
      ).rows.length,
      0,
      "withdrawal also closes visible pending corrections",
    );
  } finally {
    await db.close();
  }
});
