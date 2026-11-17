import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";
import {
  EMPTY_ARTICLE,
  type ArticleInput,
} from "../src/features/articles/model";
import {
  articleDraftSchema,
  articleInputSchema,
} from "../src/features/articles/validation";
import {
  CAFECITO_RESERVED_SLUGS,
  isCafecitoSlug,
} from "../src/features/articles/cafecito";
import type {
  ArticleDraft,
  ArticleProfile,
} from "../src/features/articles/db-contract";

// Synthetic records in a local PostgreSQL engine; no remote connection or user data.
const author = "51000000-0000-4000-8000-000000000001";
const other = "51000000-0000-4000-8000-000000000002";
const moderator = "51000000-0000-4000-8000-000000000003";
const fixture: ArticleInput = {
  ...EMPTY_ARTICLE,
  title: "Artículo sintético para pruebas",
  blocks: [
    {
      type: "paragraph",
      text: "Contenido sintético que verifica las publicaciones revisadas.",
    },
  ],
  sources: [{ label: "Fuente de prueba", url: "https://example.org/source" }],
  showCafecito: true,
};

test("articles isolate drafts, enforce review and preserve safe publication snapshots", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await db.query("insert into auth.users values ($1),($2),($3)", [
      author,
      other,
      moderator,
    ]);
    await applyMigrations(db);
    await db.query(
      "insert into public.community_members values ($1,'moderator')",
      [moderator],
    );
    async function as(id: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id ?? "",
      ]);
      await db.exec(`set role ${role}`);
    }
    const save = async (
      data: unknown,
      id: string | null = null,
      revision = 0,
    ) =>
      (
        await db.query<{ id: string }>(
          "select public.article_save($1,$2::jsonb,$3) as id",
          [id, JSON.stringify(data), revision],
        )
      ).rows[0].id;
    const draft = async (id: string) =>
      (
        await db.query<ArticleDraft>(
          "select * from public.article_drafts where id=$1",
          [id],
        )
      ).rows[0];
    const profile = async () =>
      (
        await db.query<ArticleProfile>(
          "select * from public.article_profiles where user_id=$1",
          [author],
        )
      ).rows[0];
    const submit = async (id: string, revision: number) =>
      db.query("select public.article_submit($1,$2)", [id, revision]);
    const moderate = async (
      id: string,
      revision: number,
      decision = "approved",
    ) =>
      db.query(
        "select public.article_moderate($1,$2,$3,'Decisión sintética de moderación')",
        [id, revision, decision],
      );
    const publicRows = async () =>
      (
        await db.query<{ id: string; data: ArticleInput; version: number }>(
          "select id,data,version from public.articles",
        )
      ).rows;
    let articleId = "";
    let profileId = "";

    await t.test(
      "SQL checks malformed documents even when the web layer is bypassed",
      async () => {
        const agenda: ArticleInput = {
          ...fixture,
          kind: "agenda",
          blocks: [],
          agenda: [
            {
              date: "2028-02-29",
              title: "Actividad sintética",
              details: "",
              kind: "activity",
            },
          ],
        };
        const cases: unknown[] = [
          fixture,
          EMPTY_ARTICLE,
          agenda,
          { ...fixture, extra: "unexpected" },
          { ...fixture, blocks: null },
          { ...fixture, showCafecito: "true" },
          { ...fixture, locality: "Capital", province: "" },
          {
            ...fixture,
            blocks: [{ type: "html", text: "<script>bad()</script>" }],
          },
          {
            ...fixture,
            blocks: [
              { type: "link", label: "Enlace", url: "javascript:alert(1)" },
            ],
          },
          {
            ...fixture,
            blocks: [
              { type: "table", headers: ["Uno"], rows: [["Uno", "Dos"]] },
            ],
          },
          {
            ...fixture,
            sources: [
              { label: "Fuente", url: "https://valid.example\\@evil.example" },
            ],
          },
          { ...agenda, sources: [] },
          { ...agenda, agenda: [{ ...agenda.agenda[0], date: "2027-02-29" }] },
          { ...agenda, expiresOn: "2028-02-28" },
          { ...fixture, title: "x".repeat(161) },
          { ...fixture, title: "\t\n\r\u00a0\ufeff" },
          { ...fixture, blocks: [{ type: "paragraph", text: "\t\n\u00a0" }] },
          {
            ...fixture,
            blocks: [{ type: "list", items: ["\ufeff\u2003\r\n"] }],
          },
          {
            ...fixture,
            blocks: [
              { type: "table", headers: ["\u2028\u2029"], rows: [["Celda"]] },
            ],
          },
          {
            ...fixture,
            blocks: Array.from({ length: 41 }, () => fixture.blocks[0]),
          },
          {
            ...fixture,
            blocks: Array.from({ length: 40 }, () => ({
              type: "paragraph",
              text: "x".repeat(3000),
            })),
          },
        ];
        for (const value of cases) {
          for (const publishing of [false, true]) {
            const schema = publishing ? articleInputSchema : articleDraftSchema;
            const result = schema.safeParse(value);
            const sqlValue = result.success ? result.data : value;
            const sql = await db.query<{ valid: boolean }>(
              "select public.article_valid_document($1::jsonb,$2) as valid",
              [JSON.stringify(sqlValue), publishing],
            );
            assert.equal(
              sql.rows[0].valid,
              result.success,
              JSON.stringify({ value, publishing }),
            );
          }
        }
        for (const slug of [
          "author-one",
          "Author_2",
          "",
          "bad/route",
          "a".repeat(61),
          ...CAFECITO_RESERVED_SLUGS,
        ]) {
          const sql = await db.query<{ valid: boolean }>(
            "select public.article_cafecito_slug($1) as valid",
            [slug],
          );
          assert.equal(sql.rows[0].valid, isCafecitoSlug(slug), slug);
        }
      },
    );

    await t.test(
      "anonymous visitors and other accounts cannot see or modify private drafts",
      async () => {
        await as(null, "anon");
        await assert.rejects(save(fixture), /permission denied/);
        await assert.rejects(
          db.query("select * from public.article_drafts"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.article_profiles"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select public.article_require_member()"),
          /permission denied/,
        );
        await as(author);
        articleId = await save(fixture);
        await assert.rejects(submit(articleId, 1), /PROFILE_REQUIRED/);
        await assert.rejects(
          db.query("select public.article_profile_save($1,null,0)", [
            "\t\n\r\u00a0\ufeff".repeat(5),
          ]),
          /INVALID_PROFILE/,
        );
        profileId = (
          await db.query<{ id: string }>(
            "select public.article_profile_save('Autor sintético','synthetic-author',0) as id",
          )
        ).rows[0].id;
        await assert.rejects(
          db.query("update public.article_drafts set status='approved'"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("update public.article_profiles set cafecito_approved=true"),
          /permission denied/,
        );
        await as(other);
        assert.equal(
          (await db.query("select * from public.article_drafts")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.article_profiles")).rows.length,
          0,
        );
        await assert.rejects(save(fixture, articleId, 1), /NOT_FOUND/);
        await assert.rejects(submit(articleId, 1), /NOT_FOUND/);
        await assert.rejects(
          db.query("select public.article_withdraw($1)", [articleId]),
          /NOT_FOUND/,
        );
        await assert.rejects(moderate(articleId, 1), /MODERATOR_REQUIRED/);
        await as(null, "anon");
        assert.deepEqual(await publicRows(), []);
        assert.equal(
          (
            await db.query("select * from public.article_author($1)", [
              profileId,
            ])
          ).rows.length,
          0,
        );
      },
    );

    await t.test(
      "review publishes an immutable version and pending edits remain private",
      async () => {
        await as(author);
        await submit(articleId, (await draft(articleId)).revision);
        const submitted = await draft(articleId);
        await as(moderator);
        await assert.rejects(
          moderate(articleId, submitted.revision - 1),
          /STALE_VERSION/,
        );
        await moderate(articleId, submitted.revision);
        await as(null, "anon");
        assert.equal((await publicRows())[0].data.title, fixture.title);
        await assert.rejects(
          db.query("select author_id from public.articles"),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.article_revisions"),
          /permission denied/,
        );
        const publicAuthor = (
          await db.query<{
            id: string;
            display_name: string;
            cafecito_slug: string | null;
          }>("select * from public.article_author($1)", [profileId])
        ).rows[0];
        assert.equal(publicAuthor.cafecito_slug, null);
        assert.deepEqual(Object.keys(publicAuthor).sort(), [
          "cafecito_slug",
          "display_name",
          "id",
        ]);
        await as(author);
        const approved = await draft(articleId);
        await save(
          { ...fixture, title: "Edición privada que espera revisión" },
          articleId,
          approved.revision,
        );
        await assert.rejects(
          save(fixture, articleId, approved.revision),
          /STALE_VERSION/,
        );
        await as(other);
        assert.equal(
          (await db.query("select * from public.article_revisions")).rows
            .length,
          0,
        );
        assert.equal((await publicRows())[0].data.title, fixture.title);
        await as(author);
        await submit(articleId, (await draft(articleId)).revision);
        await as(moderator);
        await moderate(
          articleId,
          (await draft(articleId)).revision,
          "rejected",
        );
        await as(author);
        assert.equal((await draft(articleId)).status, "rejected");
        assert.equal((await publicRows())[0].data.title, fixture.title);
        const historical = (
          await db.query<{ data: ArticleInput }>(
            "select data from public.article_revisions where article_id=$1 and version=1",
            [articleId],
          )
        ).rows[0];
        await save(
          historical.data,
          articleId,
          (await draft(articleId)).revision,
        );
        await submit(articleId, (await draft(articleId)).revision);
        await as(moderator);
        await moderate(articleId, (await draft(articleId)).revision);
        assert.equal((await publicRows())[0].version, 2);
      },
    );

    await t.test(
      "RPC null arguments and blank decisions fail without changing stored state",
      async () => {
        await as(author);
        const current = await draft(articleId);
        const currentProfile = await profile();
        const invalidOwnerCalls: [string, unknown[], RegExp][] = [
          ["select public.article_save(null,null,0)", [], /INVALID_ARTICLE/],
          [
            "select public.article_save($1,$2::jsonb,null)",
            [articleId, JSON.stringify(fixture)],
            /STALE_VERSION/,
          ],
          [
            "select public.article_profile_save(null,null,0)",
            [],
            /INVALID_PROFILE/,
          ],
          [
            "select public.article_profile_save('Autor sintético',null,null)",
            [],
            /INVALID_PROFILE/,
          ],
          ["select public.article_submit(null,1)", [], /NOT_FOUND/],
          [
            "select public.article_submit($1,null)",
            [articleId],
            /STALE_VERSION/,
          ],
          ["select public.article_withdraw(null)", [], /NOT_FOUND/],
          [
            "select public.article_report($1,null)",
            [articleId],
            /INVALID_REPORT/,
          ],
          [
            "select public.article_report($1,$2)",
            [articleId, "\t\n\u00a0\ufeff".repeat(5)],
            /INVALID_REPORT/,
          ],
          [
            "select public.article_report(null,'Motivo sintético válido')",
            [],
            /NOT_FOUND/,
          ],
        ];
        for (const [sql, args, expected] of invalidOwnerCalls)
          await assert.rejects(db.query(sql, args), expected);
        assert.equal((await draft(articleId)).revision, current.revision);
        assert.equal((await profile()).revision, currentProfile.revision);
        await as(moderator);
        const invalidModeratorCalls: [string, unknown[], RegExp][] = [
          [
            "select public.article_moderate(null,1,'approved','Decisión sintética válida')",
            [],
            /NOT_FOUND/,
          ],
          [
            "select public.article_moderate($1,1,null,'Decisión sintética válida')",
            [articleId],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_moderate($1,1,'approved',null)",
            [articleId],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_moderate($1,1,'approved',$2)",
            [articleId, "\t\n\u00a0\ufeff".repeat(5)],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_profile_moderate(null,1,true,'Decisión sintética válida')",
            [],
            /NOT_FOUND/,
          ],
          [
            "select public.article_profile_moderate($1,null,true,'Decisión sintética válida')",
            [profileId],
            /STALE_VERSION/,
          ],
          [
            "select public.article_profile_moderate($1,1,null,'Decisión sintética válida')",
            [profileId],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_profile_moderate($1,1,true,$2)",
            [profileId, "\t\n\u00a0\ufeff".repeat(5)],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_resolve_report(null,'Decisión sintética válida',false)",
            [],
            /NOT_REVIEWABLE/,
          ],
          [
            "select public.article_resolve_report(null,'Decisión sintética válida',null)",
            [],
            /INVALID_DECISION/,
          ],
          [
            "select public.article_resolve_report(null,$1,false)",
            ["\t\n\u00a0\ufeff".repeat(5)],
            /INVALID_DECISION/,
          ],
        ];
        for (const [sql, args, expected] of invalidModeratorCalls)
          await assert.rejects(db.query(sql, args), expected);
        await as(null);
        await assert.rejects(save(fixture), /AUTH_REQUIRED/);
        assert.equal(
          (await db.query("select * from public.article_author(null)")).rows
            .length,
          0,
        );
      },
    );

    await t.test(
      "Cafecito changes invalidate approval immediately and moderation is independent",
      async () => {
        await as(moderator);
        await db.query(
          "select public.article_profile_moderate($1,1,true,'Destino sintético revisado')",
          [profileId],
        );
        await as(null, "anon");
        assert.equal(
          (
            await db.query<{ cafecito_slug: string }>(
              "select * from public.article_author($1)",
              [profileId],
            )
          ).rows[0].cafecito_slug,
          "synthetic-author",
        );
        await as(author);
        await db.query(
          "select public.article_profile_save($1,'synthetic-author',$2)",
          ["\u00a0Autor sintético\n", (await profile()).revision],
        );
        assert.equal(
          (await profile()).cafecito_approved,
          true,
          "normalizing the same name preserves its review",
        );
        await db.query(
          "select public.article_profile_save('Otra firma sintética','synthetic-author',$1)",
          [(await profile()).revision],
        );
        const renamed = await profile();
        assert.equal(
          renamed.cafecito_approved,
          false,
          "a new public name requires Cafecito review again",
        );
        assert.equal(renamed.decision_note, null);
        await as(null, "anon");
        assert.equal(
          (
            await db.query<{ cafecito_slug: string | null }>(
              "select * from public.article_author($1)",
              [profileId],
            )
          ).rows[0].cafecito_slug,
          null,
        );
        await as(moderator);
        await db.query(
          "select public.article_profile_moderate($1,$2,true,'Nueva firma sintética revisada')",
          [profileId, renamed.revision],
        );
        await as(author);
        await db.query(
          "select public.article_profile_save('Autor sintético','new-destination',$1)",
          [(await profile()).revision],
        );
        const changed = await profile();
        assert.equal(changed.cafecito_approved, false);
        assert.equal(changed.decision_note, null);
        await as(null, "anon");
        assert.equal(
          (
            await db.query<{ cafecito_slug: null }>(
              "select * from public.article_author($1)",
              [profileId],
            )
          ).rows[0].cafecito_slug,
          null,
        );
        await as(moderator);
        await assert.rejects(
          db.query(
            "select public.article_profile_moderate($1,1,true,'Destino sintético revisado')",
            [profileId],
          ),
          /STALE_VERSION/,
        );
        await db.query(
          "select public.article_profile_moderate($1,$2,false,'Destino rechazado en prueba')",
          [profileId, changed.revision],
        );
        await as(author);
        assert.ok((await profile()).decision_note);
        await db.query(
          "select public.article_profile_save('Autor sintético',null,$1)",
          [(await profile()).revision],
        );
        assert.equal((await profile()).cafecito_slug, null);
        await assert.rejects(
          db.query(
            "select public.article_profile_save('Autor sintético','faq',$1)",
            [(await profile()).revision],
          ),
          /INVALID_PROFILE/,
        );
        await as(moderator);
        const own = (
          await db.query<{ id: string }>(
            "select public.article_profile_save('Moderador sintético','moderator-test',0) as id",
          )
        ).rows[0].id;
        await assert.rejects(
          db.query(
            "select public.article_profile_moderate($1,1,true,'Revisión propia no permitida')",
            [own],
          ),
          /SELF_REVIEW/,
        );
        const ownArticle = await save(fixture);
        await submit(ownArticle, 1);
        await assert.rejects(moderate(ownArticle, 2), /SELF_REVIEW/);
      },
    );

    await t.test(
      "reports are private and hiding/withdrawal invalidate pending review",
      async () => {
        await as(author);
        await save(
          { ...fixture, title: "Pendiente durante reporte sintético" },
          articleId,
          (await draft(articleId)).revision,
        );
        await submit(articleId, (await draft(articleId)).revision);
        const submitted = await draft(articleId);
        await as(other);
        await db.query(
          "select public.article_report($1,'Problema sintético para comprobar privacidad')",
          [articleId],
        );
        await assert.rejects(
          db.query(
            "select public.article_report($1,'Mismo reporte no debe duplicarse')",
            [articleId],
          ),
          /DUPLICATE_REPORT/,
        );
        const reportId = (
          await db.query<{ id: string }>(
            "select id from public.article_reports",
          )
        ).rows[0].id;
        await as(author);
        assert.equal(
          (await db.query("select * from public.article_reports")).rows.length,
          0,
        );
        await as(moderator);
        await db.query(
          "select public.article_resolve_report($1,'Retiro sintético por revisión',true)",
          [reportId],
        );
        await assert.rejects(
          moderate(articleId, submitted.revision),
          /STALE_VERSION/,
        );
        await as(null, "anon");
        assert.deepEqual(await publicRows(), []);
        assert.equal(
          (
            await db.query("select * from public.article_author($1)", [
              profileId,
            ])
          ).rows.length,
          0,
        );
        await as(author);
        assert.ok(
          (
            await db.query(
              "select * from public.article_revisions where article_id=$1",
              [articleId],
            )
          ).rows.length,
        );
        await save(fixture, articleId, (await draft(articleId)).revision);
        await submit(articleId, (await draft(articleId)).revision);
        const resubmitted = await draft(articleId);
        await db.query("select public.article_withdraw($1)", [articleId]);
        await as(moderator);
        await assert.rejects(
          moderate(articleId, resubmitted.revision),
          /STALE_VERSION/,
        );
        await as(author);
        await submit(articleId, (await draft(articleId)).revision);
        await as(moderator);
        await moderate(articleId, (await draft(articleId)).revision);
        assert.equal((await publicRows())[0].version, 3);
      },
    );

    await t.test(
      "rate limits apply to RPC callers and deleting an account removes its public identity",
      async () => {
        await db.exec("reset role");
        await db.query(
          "update public.article_write_limits set writes=120,window_start=now() where user_id=$1",
          [author],
        );
        await as(author);
        await assert.rejects(save(fixture), /RATE_LIMIT/);
        await db.exec("reset role");
        await db.query("delete from auth.users where id=$1", [author]);
        for (const [table, column, value] of [
          ["article_profiles", "id", profileId],
          ["article_drafts", "id", articleId],
          ["articles", "id", articleId],
          ["article_revisions", "article_id", articleId],
          ["article_reports", "article_id", articleId],
        ]) {
          assert.equal(
            (
              await db.query(
                `select * from public.${table} where ${column}=$1`,
                [value],
              )
            ).rows.length,
            0,
            table,
          );
        }
        await as(null, "anon");
        assert.deepEqual(await publicRows(), []);
        assert.equal(
          (
            await db.query("select * from public.article_author($1)", [
              profileId,
            ])
          ).rows.length,
          0,
        );
      },
    );
  } finally {
    await db.close();
  }
});
