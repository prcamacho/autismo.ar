import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";
import {
  youtubeVideoId,
  youtubeWatchUrl,
} from "../src/features/articles/youtube";
import { createEmptyArticle } from "../src/features/articles/model";
import {
  articleDraftSchema,
  articleInputSchema,
} from "../src/features/articles/validation";
import { articleSummary } from "../src/features/articles/content";

const id = "AbCdEf_12-3";
const accepted = [
  `https://www.youtube.com/watch?v=${id}`,
  `https://youtube.com/watch?feature=shared&v=${id}&t=30#section`,
  `https://m.youtube.com/watch?v=${id}`,
  `https://youtu.be/${id}?si=test`,
  `https://www.youtube.com/shorts/${id}`,
  `https://youtube.com/live/${id}/`,
  `https://www.youtube.com/embed/${id}`,
  `  https://youtu.be/${id}  `,
];
const rejected = [
  "https://youtube.com/@channel",
  "https://youtube.com/playlist?list=123",
  `https://youtube.com.evil.org/watch?v=${id}`,
  `https://youtube.com@evil.org/watch?v=${id}`,
  `https://evil.org/youtube.com/watch?v=${id}`,
  `http://youtube.com/watch?v=${id}`,
  `javascript:alert(1)`,
  `<iframe src="https://youtube.com/embed/${id}"></iframe>`,
  `https://youtube.com:443/watch?v=${id}`,
  `https://youtube.com/watch?v=${id}&v=${id}`,
  `https://youtube.com/watch#?v=${id}`,
  `https://youtube.com/watch?v=short`,
  `https://youtube.com/watch?v=${id}long`,
  `https://youtu.be/${id}/extra`,
  `https://youtu.be/${id}\n?test=1`,
  "https://youtube.com/watch?v=%41bCdEf_12-3",
];
const documentWith = (url: string, display = "embed") => ({
  ...createEmptyArticle(),
  title: "Video para prueba local",
  blocks: [{ type: "youtube", label: "Título del video", url, display }],
});

test("YouTube blocks accept video links, reject arbitrary embeds and preserve old links", () => {
  for (const url of accepted) {
    assert.equal(youtubeVideoId(url), id, url);
    for (const display of ["link", "embed"]) {
      const parsed = articleInputSchema.parse(documentWith(url, display));
      assert.equal(articleSummary(parsed), "Título del video");
      assert.deepEqual(
        articleInputSchema.parse(JSON.parse(JSON.stringify(parsed))),
        parsed,
      );
    }
  }
  for (const url of rejected) {
    assert.equal(youtubeVideoId(url), null, url);
    assert.equal(
      articleDraftSchema.safeParse(documentWith(url)).success,
      false,
      url,
    );
  }
  assert.equal(youtubeWatchUrl(id), `https://www.youtube.com/watch?v=${id}`);
  assert.equal(articleDraftSchema.safeParse(documentWith("")).success, true);
  assert.equal(articleInputSchema.safeParse(documentWith("")).success, false);
  assert.equal(
    articleDraftSchema.safeParse(documentWith(accepted[0], "html")).success,
    false,
  );
  assert.equal(
    articleInputSchema.safeParse({
      ...documentWith(""),
      blocks: [
        { type: "link", label: "Enlace anterior", url: "https://example.org" },
      ],
    }).success,
    true,
  );
});

test("SQL enforces the same YouTube contract and keeps video changes under independent review", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await applyMigrations(db);
    for (const url of [...accepted, ...rejected, ""]) {
      const result = await db.query<{ id: string | null }>(
        "select public.article_youtube_id($1) as id",
        [url],
      );
      assert.equal(result.rows[0].id, youtubeVideoId(url), url);
      for (const publishing of [false, true]) {
        const data = documentWith(url);
        const sql = await db.query<{ valid: boolean }>(
          "select public.article_valid_document($1::jsonb,$2) as valid",
          [JSON.stringify(data), publishing],
        );
        assert.equal(
          sql.rows[0].valid,
          (publishing ? articleInputSchema : articleDraftSchema).safeParse(data)
            .success,
          `${url}, publishing=${publishing}`,
        );
      }
    }
    for (const block of [
      { ...documentWith(accepted[0]).blocks[0], display: "html" },
      { ...documentWith(accepted[0]).blocks[0], html: "<script>bad</script>" },
      { type: "youtube", label: "Missing display", url: accepted[0] },
    ]) {
      const sql = await db.query<{ valid: boolean }>(
        "select public.article_valid_document($1::jsonb,true) as valid",
        [JSON.stringify({ ...documentWith(""), blocks: [block] })],
      );
      assert.equal(sql.rows[0].valid, false);
    }

    const author = "52000000-0000-4000-8000-000000000001";
    const reviewer = "52000000-0000-4000-8000-000000000002";
    await db.query("insert into auth.users values ($1),($2)", [
      author,
      reviewer,
    ]);
    // Both have moderator permissions, but must still use independent review.
    await db.query(
      "insert into public.community_members values ($1,'moderator'),($2,'moderator')",
      [author, reviewer],
    );
    const as = async (actor: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        actor,
      ]);
      await db.exec("set role authenticated");
    };
    await as(author);
    await db.query(
      "select public.article_profile_save('Autor sintético',null,0)",
    );
    const saved = await db.query<{ id: string }>(
      "select public.article_save(null,$1::jsonb,0) as id",
      [JSON.stringify(documentWith(accepted[0], "link"))],
    );
    const article = saved.rows[0].id;
    await db.query("select public.article_submit($1,1)", [article]);
    await assert.rejects(
      db.query(
        "select public.article_moderate($1,2,'approved','Revisión sintética de video')",
        [article],
      ),
      /SELF_REVIEW/,
    );
    await as(reviewer);
    await db.query(
      "select public.article_moderate($1,2,'approved','Revisión sintética de video')",
      [article],
    );
    await as(author);
    await db.query("select public.article_save($1,$2::jsonb,3)", [
      article,
      JSON.stringify(documentWith(accepted[0], "embed")),
    ]);
    await db.query("select public.article_submit($1,4)", [article]);
    const published = await db.query<{ display: string }>(
      "select data->'blocks'->0->>'display' as display from public.articles where id=$1",
      [article],
    );
    assert.equal(published.rows[0].display, "link");
    await as(reviewer);
    await db.query(
      "select public.article_moderate($1,5,'approved','Revisión sintética de video')",
      [article],
    );
    const updated = await db.query<{ display: string }>(
      "select data->'blocks'->0->>'display' as display from public.articles where id=$1",
      [article],
    );
    assert.equal(updated.rows[0].display, "embed");
    await db.query(
      "select public.article_report($1,'Reporte sintético del video publicado')",
      [article],
    );
    const report = await db.query<{ id: string }>(
      "select id from public.article_reports where article_id=$1",
      [article],
    );
    await db.query(
      "select public.article_resolve_report($1,'Retiro sintético del video reportado',true)",
      [report.rows[0].id],
    );
    assert.equal(
      (await db.query("select id from public.articles where id=$1", [article]))
        .rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
