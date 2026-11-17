import assert from "node:assert/strict";
import { test } from "node:test";
import { currentDateInArgentina } from "../src/lib/format";
import {
  cafecitoUrl,
  parseCafecitoEmbed,
  CAFECITO_RESERVED_SLUGS,
} from "../src/features/articles/cafecito";
import {
  articleHasExpired,
  articleInlineText,
  articleShareText,
  articleSummary,
  formatArticleDate,
  isCalendarDate,
} from "../src/features/articles/content";
import {
  createEmptyArticle,
  EMPTY_ARTICLE,
  type ArticleInput,
} from "../src/features/articles/model";
import {
  articleDraftSchema,
  articleInputSchema,
} from "../src/features/articles/validation";

const profile = "https://cafecito.app/autor_prueba";

test("article expiry changes at midnight in Argentina instead of UTC", () => {
  assert.equal(
    currentDateInArgentina(new Date("2026-11-21T02:59:59Z")),
    "2026-11-20",
  );
  assert.equal(
    currentDateInArgentina(new Date("2026-11-21T03:00:00Z")),
    "2026-11-21",
  );
  assert.equal(
    articleHasExpired(
      "2026-11-20",
      currentDateInArgentina(new Date("2026-11-21T02:59:59Z")),
    ),
    false,
  );
  assert.equal(
    articleHasExpired(
      "2026-11-20",
      currentDateInArgentina(new Date("2026-11-21T03:00:00Z")),
    ),
    true,
  );
});
const image = "https://cdn.cafecito.app/imgs/buttons/button_1.png";
const button = `<a href='${profile}' rel='noopener' target='_blank'><img srcset='${image} 1x, https://cdn.cafecito.app/imgs/buttons/button_1_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_1_3.75x.png 3.75x' src='${image}' alt='Invitame un café en cafecito.app' /></a>`;

function article(): ArticleInput {
  return {
    ...createEmptyArticle(),
    title: "Artículo sintético de prueba",
    blocks: [
      {
        type: "paragraph",
        text: "Contenido sintético para comprobar el editor.",
      },
    ],
  };
}

function agenda(): ArticleInput {
  return {
    ...createEmptyArticle(),
    title: "Agenda sintética de prueba",
    kind: "agenda",
    agenda: [
      {
        date: "2026-11-20",
        title: "Especialidad sintética",
        details: "",
        kind: "request",
      },
      {
        date: "2026-11-21",
        title: "Actividad sintética",
        details: "",
        kind: "activity",
      },
    ],
    sources: [{ label: "Fuente sintética", url: "https://example.org/agenda" }],
  };
}

test("Cafecito imports a destination without preserving or executing the embed", () => {
  const expected = { slug: "autor_prueba", url: profile };
  assert.deepEqual(parseCafecitoEmbed(button), expected);
  assert.deepEqual(parseCafecitoEmbed(`\n${profile}/\n`), expected);
  assert.deepEqual(
    parseCafecitoEmbed(
      `<a target="_blank" href="${profile}" rel="noopener noreferrer"><img alt="Cafecito" src="${image}"></a>`,
    ),
    expected,
  );
  assert.deepEqual(
    parseCafecitoEmbed(
      `[![Cafecito](https://cdn.cafecito.app/imgs/buttons/button_2.svg)](${profile})`,
    ),
    expected,
  );
  assert.equal(cafecitoUrl("autor_prueba"), profile);
});

test("Cafecito rejects executable content, ambiguous recipients and foreign destinations", () => {
  const attacks = [
    "javascript:alert(1)",
    "//cafecito.app/autor_prueba",
    "http://cafecito.app/autor_prueba",
    "https://cafecito.app.evil.example/autor_prueba",
    "https://cafecito.app@evil.example/autor_prueba",
    "https://cafecito.app:443/autor_prueba",
    "https://cafecito.app/autor_prueba?redirect=evil",
    "https://cafecito.app/autor_prueba#otro",
    "https://cafecito.app/%61utor_prueba",
    "https://cafecito.app/autor_prueba/otro",
    "https://cafecito.app/autor_prueba\u0000",
    "alias.bancario.ejemplo",
    `${button}<script>alert(1)</script>`,
    `<script>${button}</script>`,
    `${button}${button.replaceAll("autor_prueba", "otra_persona")}`,
    button.replace(
      "rel='noopener'",
      "href='https://cafecito.app/otra_persona'",
    ),
    button.replace(
      "alt='Invitame un café en cafecito.app'",
      "onerror='alert(1)'",
    ),
    button.replace("rel='noopener'", "style='position:fixed'"),
    button.replace("rel='noopener'", "data-x='ignored'"),
    button.replaceAll(
      "https://cdn.cafecito.app",
      "https://cdn.cafecito.app.evil.example",
    ),
    button.replace("button_1_2x.png", "button_2_2x.png"),
    button.replace("href=", "hrefx="),
    button.replace("</a>", "<!-- ignored --></a>"),
    button.replace("<img", "<iframe"),
    button.replace(
      "https://cafecito.app/autor_prueba",
      "https://cafecito.app/autor_prueba&amp;bad",
    ),
    "x".repeat(4097),
  ];
  for (const attack of attacks)
    assert.equal(parseCafecitoEmbed(attack), null, attack);
  for (const reserved of CAFECITO_RESERVED_SLUGS) {
    assert.equal(parseCafecitoEmbed(`https://cafecito.app/${reserved}`), null);
    assert.equal(
      parseCafecitoEmbed(`https://cafecito.app/${reserved.toUpperCase()}`),
      null,
    );
  }
  assert.throws(() => cafecitoUrl("bad/recipient"), /Invalid Cafecito/);
});

test("article drafts preserve incomplete work but publication requires complete content", () => {
  assert.equal(
    articleDraftSchema.safeParse(createEmptyArticle()).success,
    true,
  );
  assert.equal(
    articleInputSchema.safeParse(createEmptyArticle()).success,
    false,
  );
  assert.equal(articleInputSchema.safeParse(article()).success, true);
  const incomplete = {
    ...article(),
    blocks: [{ type: "link", label: "", url: "" }],
  };
  assert.equal(articleDraftSchema.safeParse(incomplete).success, true);
  assert.equal(articleInputSchema.safeParse(incomplete).success, false);
  assert.equal(
    articleDraftSchema.safeParse({
      ...incomplete,
      blocks: [{ type: "link", label: "Sitio", url: "javascript:alert(1)" }],
    }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({ ...article(), css: "body{display:none}" })
      .success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      blocks: [{ type: "html", text: "<p>Texto</p>" }],
    }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({ ...article(), theme: "arbitrary" }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({ ...article(), category: "invalid" }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      locality: "Capital",
      province: "",
    }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      locality: "Capital",
      province: "salta",
    }).success,
    true,
  );
  const copy = createEmptyArticle();
  copy.blocks.push({ type: "paragraph", text: "Separado" });
  assert.equal(EMPTY_ARTICLE.blocks.length, 0);
});

test("article validation bounds documents and rejects broken tables", () => {
  const table = {
    type: "table" as const,
    headers: ["Fecha", "Actividad"],
    rows: [["20/11", "Sintética"]],
  };
  assert.equal(
    articleInputSchema.safeParse({ ...article(), blocks: [table] }).success,
    true,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      blocks: [{ ...table, rows: [["20/11"]] }],
    }).success,
    false,
  );
  assert.equal(
    articleInputSchema.safeParse({
      ...article(),
      blocks: [{ ...table, rows: [["", ""]] }],
    }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      blocks: Array.from({ length: 41 }, () => ({
        type: "paragraph",
        text: "Texto",
      })),
    }).success,
    false,
  );
  assert.equal(
    articleDraftSchema.safeParse({
      ...article(),
      blocks: Array.from({ length: 11 }, () => ({
        type: "paragraph",
        text: "á".repeat(3000),
      })),
    }).success,
    false,
  );
});

test("calendar-only dates validate leap years and retain the exact day", () => {
  for (const value of [
    "2024-02-29",
    "2000-02-29",
    "2026-11-20",
    "0001-01-01",
    "9999-12-31",
  ])
    assert.equal(isCalendarDate(value), true, value);
  for (const value of [
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "0000-01-01",
    "2026-13-01",
    "2026-01-00",
    "2026-1-01",
    "2026-11-20T00:00:00Z",
  ])
    assert.equal(isCalendarDate(value), false, value);
  assert.equal(formatArticleDate("2026-11-20"), "20/11/2026");
  assert.equal(formatArticleDate("invalid"), "");
  assert.equal(articleHasExpired("2026-11-20", "2026-11-20"), false);
  assert.equal(articleHasExpired("2026-11-20", "2026-11-21"), true);
  assert.equal(articleHasExpired("", "2026-11-21"), false);
});

test("agenda publication requires complete dates, source and consistent expiry", () => {
  assert.equal(articleInputSchema.safeParse(agenda()).success, true);
  assert.equal(
    articleInputSchema.safeParse({ ...agenda(), sources: [] }).success,
    false,
  );
  assert.equal(
    articleInputSchema.safeParse({ ...agenda(), expiresOn: "2026-11-19" })
      .success,
    false,
  );
  assert.equal(
    articleInputSchema.safeParse({ ...agenda(), expiresOn: "2026-11-21" })
      .success,
    true,
  );
  const invalid = {
    ...agenda(),
    agenda: [
      { date: "2026-02-30", title: "Texto", details: "", kind: "request" },
    ],
  };
  assert.equal(articleDraftSchema.safeParse(invalid).success, false);
  const unfinished = {
    ...agenda(),
    agenda: [{ date: "", title: "", details: "", kind: "request" }],
  };
  assert.equal(articleDraftSchema.safeParse(unfinished).success, true);
  assert.equal(articleInputSchema.safeParse(unfinished).success, false);
  assert.equal(
    articleInputSchema.safeParse({
      ...unfinished,
      kind: "article",
      blocks: article().blocks,
    }).success,
    false,
  );
});

test("share summaries derive from content, preserve text, and bound generated previews", () => {
  const schedule = agenda();
  const summary = articleSummary(schedule);
  assert.match(
    summary,
    /20\/11\/2026 · Solicitud de turno: Especialidad sintética/,
  );
  assert.match(summary, /21\/11\/2026 · Actividad: Actividad sintética/);
  const message = articleShareText(
    schedule.title,
    summary,
    "https://example.org/articulos/prueba",
  );
  assert.equal(
    message,
    `${schedule.title}\n\n${summary}\n\nhttps://example.org/articulos/prueba`,
  );
  assert.equal(
    articleSummary({
      ...schedule,
      summary: "  Resumen **elegido**\npor el autor. ",
    }),
    "Resumen elegido por el autor.",
  );
  assert.equal(
    Array.from(
      articleSummary({
        ...article(),
        blocks: [{ type: "paragraph", text: "🙂".repeat(500) }],
      }),
    ).length,
    300,
  );
  const literal = '<img src="x" onerror="alert(1)">';
  assert.deepEqual(articleInlineText(`Texto **${literal}** final`), [
    { text: "Texto ", bold: false },
    { text: literal, bold: true },
    { text: " final", bold: false },
  ]);
  assert.equal(articleSummary({ ...article(), summary: literal }), literal);
});
