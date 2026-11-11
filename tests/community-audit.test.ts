import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { readViewer } from "../src/features/auth/viewer";
import { readResourceRevision } from "../src/features/resources/revision";
import { isPublicHttpUrl } from "../src/lib/public-url";
import { categories } from "../src/lib/catalog";
import { PROVINCES } from "../src/lib/geography";
import { requiredFields } from "../src/features/community/fields";
import {
  resourceInputSchema,
  ageGroups,
} from "../src/features/resources/validation";
import { applyMigrations } from "./helpers/migrations";

const moderator = "10000000-0000-4000-8000-000000000003";
const member = "10000000-0000-4000-8000-000000000004";
const resourceId = "20000000-0000-4000-8000-000000000001";
const fixture = resourceInputSchema.parse({
  name: "Ficha sintética para pruebas",
  description: "Descripción sintética para las pruebas locales de regresión.",
  categoryIds: ["centros"],
  scope: "national",
});

test("application queries and SQL contracts stay aligned", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      "create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;",
    );
    await applyMigrations(db);
    await db.query("insert into auth.users values ($1),($2)", [
      moderator,
      member,
    ]);
    await db.query(
      "insert into public.community_members values ($1,'moderator')",
      [moderator],
    );
    await db.query(
      "insert into public.resources(id,slug,version,data,source_url) values ($1,$2,41,$3,'https://example.org/current')",
      [resourceId, resourceId, JSON.stringify(fixture)],
    );
    await db.query(
      "insert into public.resource_revisions(resource_id,version,data,source_url) values($1,1,$2,'https://example.org/old')",
      [
        resourceId,
        JSON.stringify({ ...fixture, name: "Versión histórica sintética" }),
      ],
    );

    let currentUser = moderator;
    let failingTable = "";
    // Real query builder against the migration's columns, with local read-only transport.
    const client = createClient<Database>(
      "https://example.test",
      "synthetic-key",
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: "Bearer synthetic-session" },
          fetch: async (input) => {
            const url = new URL(String(input));
            if (url.pathname === "/auth/v1/user")
              return Response.json({
                id: currentUser,
                email: "synthetic@example.test",
                aud: "authenticated",
                created_at: "2026-01-01T00:00:00Z",
              });
            const table = url.pathname.split("/").pop()!;
            if (table === failingTable)
              return Response.json(
                { code: "TEST_UNAVAILABLE", message: "Synthetic failure" },
                { status: 503 },
              );
            if (!["community_members", "resource_revisions"].includes(table))
              throw new Error("Unexpected test endpoint");
            const columns = url.searchParams.get("select")!;
            assert.match(columns, /^[a-z_]+(?:,[a-z_]+)*$/);
            const args: string[] = [];
            const conditions: string[] = [];
            for (const [column, filter] of url.searchParams) {
              if (column === "select") continue;
              assert.match(column, /^[a-z_]+$/);
              assert.ok(filter.startsWith("eq."));
              args.push(filter.slice(3));
              conditions.push('"' + column + '" = $' + args.length);
            }
            try {
              await db.exec("reset role");
              await db.query(
                "select set_config('request.jwt.claim.sub',$1,false)",
                [currentUser],
              );
              await db.exec("set role authenticated");
              const rows = await db.query(
                "select " +
                  columns +
                  ' from public."' +
                  table +
                  '" where ' +
                  conditions.join(" and "),
                args,
              );
              return Response.json(rows.rows);
            } catch {
              return Response.json(
                {
                  code: "TEST_QUERY_ERROR",
                  message: "Invalid query against real schema",
                },
                { status: 400 },
              );
            } finally {
              await db.exec("reset role");
            }
          },
        },
      },
    );

    await t.test(
      "an assigned moderator is recognized by the application",
      async () => {
        assert.equal((await readViewer(client))?.moderator, true);
        currentUser = member;
        assert.equal((await readViewer(client))?.moderator, false);
        currentUser = moderator;
      },
    );
    await t.test(
      "permission lookup errors are not silently downgraded to member",
      async () => {
        failingTable = "community_members";
        await assert.rejects(readViewer(client), /permisos/);
        failingTable = "";
      },
    );
    await t.test(
      "historical revision lookup is exact and distinguishes absence from failure",
      async () => {
        const result = await readResourceRevision(client, resourceId, 1);
        assert.equal(result.status, "ready");
        assert.equal(result.data?.version, 1);
        assert.equal(result.data?.source_url, "https://example.org/old");
        assert.equal(
          (await readResourceRevision(client, resourceId, 2)).data,
          null,
        );
        failingTable = "resource_revisions";
        const failed = await readResourceRevision(client, resourceId, 1);
        assert.equal(failed.status, "unavailable");
        assert.equal(failed.data, null);
        failingTable = "";
      },
    );
    await t.test(
      "URL validation agrees in TypeScript and PostgreSQL",
      async () => {
        const cases: [string, boolean][] = [
          ["https://example.org", true],
          ["http://a", true],
          ["https://example.org:65535/path?q=1#fragment", true],
          ["https://example.org:0/", true],
          ["http://127.0.0.1/test", true],
          ["https://example.org/información", true],
          ["javascript:alert(1)", false],
          ["https://user:secret@example.org", false],
          ["https://example.org:99999/x", false],
          ["https://example.org:65536", false],
          ["https://example.org:123456", false],
          ["https://example..org", false],
          ["https://-example.org", false],
          ["https://example.org-/", false],
          ["https://999.999.999.999", false],
          ["https://127.1", false],
          ["https://example.org/has space", false],
          ["https://example.org/\\bad", false],
          ["https://example.org/\u00a0", false],
          ["https://example.org/\ufeff", false],
          ["https://example.org/" + "a".repeat(1000), false],
        ];
        for (const [value, expected] of cases) {
          const sql = (
            await db.query<{ valid: boolean }>(
              "select public.community_valid_url($1) as valid",
              [value],
            )
          ).rows[0].valid;
          assert.equal(isPublicHttpUrl(value), expected, value);
          assert.equal(sql, expected, value);
        }
      },
    );
    await t.test(
      "category labels, provinces and ages agree with SQL",
      async () => {
        for (const category of categories) {
          const result = await db.query<{ label: string }>(
            "select public.community_category_names($1) as label",
            [JSON.stringify([category.id])],
          );
          assert.equal(result.rows[0].label, category.name);
        }
        for (const province of PROVINCES) {
          const data = resourceInputSchema.parse({
            ...fixture,
            scope: "local",
            province: province.id,
            locality: "Localidad sintética",
            ageGroups: [...ageGroups],
          });
          assert.equal(
            (
              await db.query<{ valid: boolean }>(
                "select public.community_valid_resource($1) as valid",
                [JSON.stringify(data)],
              )
            ).rows[0].valid,
            true,
          );
        }
      },
    );
    await t.test(
      "both layers require corroboration when facts change or are removed",
      async () => {
        for (const before of [
          undefined,
          fixture,
          { ...fixture, phone: "Sintético" },
          { ...fixture, coverage: "Sintética" },
          { ...fixture, ageGroups: ["Adultez"] as typeof fixture.ageGroups },
        ]) {
          const sql = (
            await db.query<{ fields: string[] }>(
              "select public.community_required_fields($1,$2) as fields",
              [JSON.stringify(fixture), before ? JSON.stringify(before) : null],
            )
          ).rows[0].fields;
          assert.deepEqual(requiredFields(fixture, before), sql);
        }
      },
    );
  } finally {
    await db.close();
  }
});
