/**
 * Explicit integration QA for the independently verified Supabase TEST project.
 * Does not read .env.local, deliver email, set passwords or contact payment sites.
 *
 * Run only after the article and YouTube-block migrations have been applied to the test project:
 * node --import tsx scripts/test-articles-integration.ts --confirm-test --expected-host hmpqojhurrtujbcakzkv.supabase.co
 *
 * The allowlisted host must be reviewed in code before targeting a different project.
 * Web activation flags do not revoke database RPC access and are not enabled here.
 * Optional ARTICLE_TEST_SITE_URL=http://127.0.0.1:3011 checks anonymous SSR and social
 * metadata against an already running test server. This script never starts that server.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createEmptyArticle,
  type ArticleInput,
} from "../src/features/articles/model";
import type {
  ArticleDraft,
  ArticleProfile,
  PublicArticleAuthor,
  PublishedArticle,
} from "../src/features/articles/db-contract";

const TEST_HOST = "hmpqojhurrtujbcakzkv.supabase.co";
const PRODUCTION_HOST = "godvlfhhnyzgoklbnwqs.supabase.co";
const ENV_PATH = ".env.exchanges-test.local";
const LOCAL_SITE_ORIGIN = "http://127.0.0.1:3011";
const PREVIEW_USER_AGENT =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const PUBLIC_COLUMNS = "id,profile_id,data,version,published_at,visible";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RPC_NAMES = new Set([
  "article_author",
  "article_profile_save",
  "article_profile_moderate",
  "article_save",
  "article_submit",
  "article_moderate",
  "article_withdraw",
  "article_report",
  "article_resolve_report",
]);
const TABLE_NAMES = new Set([
  "articles",
  "article_drafts",
  "article_profiles",
  "article_revisions",
  "article_reports",
  "community_members",
]);
type Actor = { id: string; client: SupabaseClient };
type Result = { data?: unknown; error: { message: string } | null };

function succeeded<T>(result: Result): T {
  // Never pass a provider error, response or session to assert/console output.
  assert.ok(!result.error, "operation must succeed; provider details withheld");
  return result.data as T;
}

function rejected(result: Result, code?: string) {
  assert.ok(result.error, "operation must be rejected");
  if (code)
    assert.ok(
      result.error.message.includes(code),
      `expected ${code}; provider details withheld`,
    );
}

function keyRole(key: string): unknown {
  if (!key.startsWith("eyJ")) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
    );
    if (payload.ref !== undefined)
      assert.equal(
        payload.ref,
        TEST_HOST.split(".")[0],
        "credential project does not match the reviewed target",
      );
    return payload.role;
  } catch {
    throw new Error("INVALID_TEST_CREDENTIAL");
  }
}

function permittedEndpoint(path: string) {
  if (
    path === "/auth/v1/admin/users" ||
    path === "/auth/v1/admin/generate_link" ||
    path === "/auth/v1/verify"
  )
    return true;
  if (path.startsWith("/auth/v1/admin/users/"))
    return UUID.test(path.slice("/auth/v1/admin/users/".length));
  if (path.startsWith("/rest/v1/rpc/"))
    return RPC_NAMES.has(path.slice("/rest/v1/rpc/".length));
  return (
    path.startsWith("/rest/v1/") &&
    TABLE_NAMES.has(path.slice("/rest/v1/".length))
  );
}

// Inspect known server-generated HTML attributes only; never execute or render fetched markup.
function htmlText(value: string) {
  return value.replace(
    /&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi,
    (entity) => {
      const known: Record<string, string> = {
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
      };
      const lower = entity.toLowerCase();
      if (known[lower]) return known[lower];
      const point = lower.startsWith("&#x")
        ? Number.parseInt(lower.slice(3, -1), 16)
        : Number.parseInt(lower.slice(2, -1), 10);
      return point >= 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : entity;
    },
  );
}

function headAttribute(
  html: string,
  tagName: "meta" | "link",
  key: string,
  value: string,
  attribute: string,
) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const clean = head.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const tags = clean.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  for (const tag of tags) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(
      /([a-z_:][-a-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    ))
      attributes.set(match[1].toLowerCase(), htmlText(match[2] ?? match[3]));
    if (attributes.get(key) === value) return attributes.get(attribute);
  }
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  assert.equal(
    args.length,
    3,
    "explicit test confirmation and reviewed host are required",
  );
  assert.equal(args[0], "--confirm-test", "missing explicit test confirmation");
  assert.equal(args[1], "--expected-host", "missing reviewed test host");
  const expectedHost = args[2];
  assert.notEqual(
    expectedHost,
    PRODUCTION_HOST,
    "production is never an integration-test target",
  );
  assert.equal(
    expectedHost,
    TEST_HOST,
    "only the independently verified test project is allowed",
  );

  const env = parseEnv(await readFile(ENV_PATH, "utf8"));
  const configuredSite = (
    process.env.ARTICLE_TEST_SITE_URL ?? env.ARTICLE_TEST_SITE_URL
  )?.trim();
  let siteOrigin: string | null = null;
  if (configuredSite) {
    const site = new URL(configuredSite);
    assert.equal(
      site.origin,
      LOCAL_SITE_ORIGIN,
      "HTTP checks may only target the reviewed local test server",
    );
    assert.equal(site.pathname, "/");
    assert.ok(!site.username && !site.password && !site.search && !site.hash);
    siteOrigin = site.origin;
  }
  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const secret = env.EXCHANGES_SUPABASE_SECRET_KEY ?? "";
  assert.ok(rawUrl && key && secret, "dedicated test credentials are required");
  const url = new URL(rawUrl);
  assert.equal(url.protocol, "https:");
  assert.equal(url.host, expectedHost);
  assert.equal(url.pathname, "/");
  assert.ok(!url.username && !url.password && !url.search && !url.hash);
  assert.equal(
    env.EXCHANGES_EXPECTED_SUPABASE_HOST,
    expectedHost,
    "dedicated file target must match the reviewed project",
  );
  if (env.ARTICLES_EXPECTED_SUPABASE_HOST)
    assert.equal(env.ARTICLES_EXPECTED_SUPABASE_HOST, expectedHost);
  assert.ok(
    key.startsWith("sb_publishable_") || keyRole(key) === "anon",
    "browser credential must not be privileged",
  );
  assert.ok(
    secret.startsWith("sb_secret_") || keyRole(secret) === "service_role",
    "test admin credential is required",
  );

  const transport: typeof fetch = (input, init) => {
    const target = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    assert.equal(target.protocol, "https:");
    assert.equal(target.host, expectedHost);
    assert.ok(!target.username && !target.password);
    assert.ok(
      permittedEndpoint(target.pathname),
      "endpoint is outside article integration scope",
    );
    const timeout = AbortSignal.timeout(15_000);
    return fetch(input, {
      ...init,
      redirect: "error",
      signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  };
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: transport },
  };
  const admin = createClient(rawUrl, secret, options);
  const anonymous = createClient(rawUrl, key, options);
  const runId = randomUUID();
  // Known candidate IDs let cleanup recover a lost create response without listing other accounts.
  const ownedCandidates = new Map<string, string>();
  const authenticatedActors = new Map<string, SupabaseClient>();
  const articleIds = new Set<string>();
  const profileIds = new Set<string>();
  let stage = "schema preflight";
  let complete = false;
  let cleanupErrors = 0;

  async function checkHttpArticle(
    id: string,
    expectedStatus: 200 | 404,
    title: string,
  ) {
    if (!siteOrigin) return;
    assert.ok(UUID.test(id));
    const target = new URL(`/articulos/${id}`, siteOrigin);
    assert.equal(target.origin, LOCAL_SITE_ORIGIN);
    // This transport is separate from Supabase and sends no credentials, cookies or session headers.
    const response = await fetch(target, {
      method: "GET",
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": PREVIEW_USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });
    assert.equal(
      response.status,
      expectedStatus,
      "anonymous article HTTP status differs from its publication state",
    );
    assert.ok(response.headers.get("content-type")?.includes("text/html"));
    const html = await response.text();
    assert.ok(html.length < 2_000_000, "unexpectedly large article response");
    if (expectedStatus === 404) {
      assert.ok(
        !html.includes(title),
        "an unpublished article must not leak its title into server HTML",
      );
      return;
    }
    const description =
      "20/11/2026 · Solicitud de turno: Neurología sintética; 21/11/2026 · Atención: Odontología sintética";
    assert.equal(
      headAttribute(html, "meta", "property", "og:title", "content"),
      title,
    );
    assert.equal(
      headAttribute(html, "meta", "property", "og:description", "content"),
      description,
    );
    assert.equal(
      headAttribute(html, "meta", "property", "og:url", "content"),
      target.href,
    );
    assert.equal(
      headAttribute(html, "link", "rel", "canonical", "href"),
      target.href,
    );
    const body = (
      html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ""
    ).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const heading = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
    assert.equal(htmlText(heading.replace(/<[^>]*>/g, "")).trim(), title);
    const bodyText = htmlText(body.replace(/<[^>]*>/g, " "));
    for (const expected of [
      "20/11/2026",
      "21/11/2026",
      "Neurología sintética",
      "Odontología sintética",
    ])
      assert.ok(
        bodyText.includes(expected),
        "the agenda must be present in server-rendered content",
      );
  }

  async function actor(label: string): Promise<Actor> {
    const id = randomUUID();
    const email = `article-${runId}-${label}@example.invalid`;
    ownedCandidates.set(id, email);
    const created = await admin.auth.admin.createUser({
      id,
      email,
      email_confirm: true,
      user_metadata: { article_integration_run: runId },
      app_metadata: { article_integration_run: runId },
    });
    assert.ok(
      !created.error,
      "synthetic account creation failed; details withheld",
    );
    assert.ok(created.data.user);
    // Track a returned ID too, before failing if the provider unexpectedly ignored the supplied ID.
    ownedCandidates.set(created.data.user.id, email);
    assert.equal(created.data.user.id, id);
    const generated = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    assert.ok(
      !generated.error,
      "test link generation failed; no email fallback is allowed",
    );
    assert.equal(generated.data.user?.id, id);
    assert.ok(generated.data.properties?.hashed_token);
    const client = createClient(rawUrl, key, options);
    const signed = await client.auth.verifyOtp({
      type: "magiclink",
      token_hash: generated.data.properties.hashed_token,
    });
    assert.ok(
      !signed.error && signed.data.session,
      "test verification failed; details withheld",
    );
    assert.equal(signed.data.user?.id, id);
    authenticatedActors.set(id, client);
    return { id, client };
  }

  async function readDraft(client: SupabaseClient, id: string) {
    return succeeded<ArticleDraft>(
      await client.from("article_drafts").select("*").eq("id", id).single(),
    );
  }
  async function readProfile(client: SupabaseClient, id: string) {
    return succeeded<ArticleProfile>(
      await client.from("article_profiles").select("*").eq("id", id).single(),
    );
  }
  async function published(id: string) {
    return succeeded<PublishedArticle | null>(
      await anonymous
        .from("articles")
        .select(PUBLIC_COLUMNS)
        .eq("id", id)
        .maybeSingle(),
    );
  }
  async function publicAuthor(id: string) {
    return succeeded<PublicArticleAuthor[]>(
      await anonymous.rpc("article_author", { p_id: id }),
    );
  }
  async function save(
    client: SupabaseClient,
    content: ArticleInput,
    id: string | null = null,
  ) {
    const revision = id ? (await readDraft(client, id)).revision : 0;
    const savedId = succeeded<string>(
      await client.rpc("article_save", {
        p_id: id,
        p_data: content,
        p_revision: revision,
      }),
    );
    articleIds.add(savedId);
    return savedId;
  }
  async function submit(client: SupabaseClient, id: string) {
    const current = await readDraft(client, id);
    succeeded(
      await client.rpc("article_submit", {
        p_article: id,
        p_revision: current.revision,
      }),
    );
  }
  async function approve(client: SupabaseClient, id: string) {
    const current = await readDraft(client, id);
    succeeded(
      await client.rpc("article_moderate", {
        p_article: id,
        p_revision: current.revision,
        p_decision: "approved",
        p_note: "Revisión sintética exclusiva de la prueba de integración",
      }),
    );
  }

  try {
    // These queries return no rows and must succeed before any Auth mutation.
    succeeded(await anonymous.from("articles").select(PUBLIC_COLUMNS).limit(0));
    assert.deepEqual(await publicAuthor(randomUUID()), []);
    console.log(
      "PASS article schema preflight; no synthetic account existed before this check",
    );
    if (!siteOrigin)
      console.log(
        "SKIP anonymous HTTP and social metadata checks: ARTICLE_TEST_SITE_URL is not configured",
      );

    stage = "synthetic authentication";
    const author = await actor("author");
    const stranger = await actor("stranger");
    const moderator = await actor("moderator");
    stage = "authenticated private-table grants";
    for (const [table, column] of [
      ["article_drafts", "id"],
      ["article_profiles", "id"],
      ["article_revisions", "article_id"],
      ["article_reports", "id"],
    ])
      succeeded(await author.client.from(table).select(column).limit(0));
    stage = "synthetic moderator assignment";
    succeeded(
      await admin
        .from("community_members")
        .upsert({ user_id: moderator.id, role: "moderator" }),
    );
    const fixture: ArticleInput = {
      ...createEmptyArticle(),
      title: `Artículo sintético de integración ${runId}`,
      kind: "agenda",
      summary: "",
      blocks: [
        {
          type: "paragraph",
          text: "Contenido sintético, exclusivo de una prueba en el proyecto separado.",
        },
        {
          type: "youtube",
          label: "Video sintético para comprobar la presentación",
          url: "https://youtu.be/AbCdEf_12-3",
          display: "link",
        },
      ],
      sources: [
        {
          label: "Fuente sintética",
          url: "https://example.invalid/articles-integration",
        },
      ],
      agenda: [
        {
          date: "2026-11-20",
          title: "Neurología sintética",
          details: "Solo datos de una prueba de integración.",
          kind: "request",
        },
        {
          date: "2026-11-21",
          title: "Odontología sintética",
          details: "Solo datos de una prueba de integración.",
          kind: "appointment",
        },
      ],
      showCafecito: true,
    };
    const slug = `test-${runId.slice(0, 8)}`;

    stage = "private drafts and direct-access restrictions";
    const profileId = succeeded<string>(
      await author.client.rpc("article_profile_save", {
        p_name: "Autor sintético de integración",
        p_cafecito_slug: slug,
        p_revision: 0,
      }),
    );
    profileIds.add(profileId);
    const articleId = await save(author.client, fixture);
    assert.equal(await published(articleId), null);
    assert.deepEqual(await publicAuthor(profileId), []);
    stage = "anonymous HTTP before review (404)";
    await checkHttpArticle(articleId, 404, fixture.title);
    stage = "private drafts and direct-access restrictions";
    rejected(
      await anonymous.from("article_drafts").select("id").eq("id", articleId),
    );
    rejected(
      await anonymous.from("article_profiles").select("id").eq("id", profileId),
    );
    assert.deepEqual(
      succeeded(
        await stranger.client
          .from("article_drafts")
          .select("id")
          .eq("id", articleId),
      ),
      [],
    );
    assert.deepEqual(
      succeeded(
        await stranger.client
          .from("article_profiles")
          .select("id")
          .eq("id", profileId),
      ),
      [],
    );
    rejected(
      await author.client
        .from("article_drafts")
        .update({ status: "approved" })
        .eq("id", articleId),
    );
    rejected(
      await author.client
        .from("article_profiles")
        .update({ cafecito_approved: true })
        .eq("id", profileId),
    );
    rejected(
      await stranger.client.rpc("article_save", {
        p_id: articleId,
        p_data: fixture,
        p_revision: 1,
      }),
      "NOT_FOUND",
    );
    rejected(
      await anonymous.rpc("article_save", {
        p_id: null,
        p_data: fixture,
        p_revision: 0,
      }),
    );
    rejected(
      await author.client.rpc("article_save", {
        p_id: null,
        p_data: { ...fixture, showCafecito: "true" },
        p_revision: 0,
      }),
      "INVALID_ARTICLE",
    );
    console.log(
      "PASS private drafts, owner checks, SQL validation and denied direct writes",
    );

    stage = "independent review and public identity";
    await submit(author.client, articleId);
    const submitted = await readDraft(author.client, articleId);
    rejected(
      await author.client.rpc("article_moderate", {
        p_article: articleId,
        p_revision: submitted.revision,
        p_decision: "approved",
        p_note: "Revisión propia sintética rechazada",
      }),
      "MODERATOR_REQUIRED",
    );
    await approve(moderator.client, articleId);
    assert.equal((await published(articleId))?.data.title, fixture.title);
    assert.deepEqual((await published(articleId))?.data.blocks, fixture.blocks);
    stage = "anonymous HTTP publication and social metadata (200)";
    await checkHttpArticle(articleId, 200, fixture.title);
    if (siteOrigin)
      console.log(
        "PASS anonymous SSR, both agenda dates, Open Graph text and local canonical URL",
      );
    stage = "independent review and public identity";
    rejected(
      await anonymous.from("articles").select("author_id").eq("id", articleId),
    );
    rejected(
      await anonymous
        .from("article_revisions")
        .select("version")
        .eq("article_id", articleId),
    );
    const visibleAuthor = (await publicAuthor(profileId))[0];
    assert.ok(visibleAuthor && visibleAuthor.id !== author.id);
    assert.deepEqual(Object.keys(visibleAuthor).sort(), [
      "cafecito_slug",
      "display_name",
      "id",
    ]);
    assert.equal(visibleAuthor.cafecito_slug, null);
    console.log(
      "PASS reviewed public snapshot and minimal public author identity",
    );

    stage = "Cafecito review and invalidation";
    let profile = await readProfile(author.client, profileId);
    succeeded(
      await moderator.client.rpc("article_profile_moderate", {
        p_profile: profileId,
        p_revision: profile.revision,
        p_approved: true,
        p_note: "Destino sintético aprobado sin realizar pagos",
      }),
    );
    assert.equal((await publicAuthor(profileId))[0]?.cafecito_slug, slug);
    profile = await readProfile(author.client, profileId);
    succeeded(
      await author.client.rpc("article_profile_save", {
        p_name: "Firma sintética modificada",
        p_cafecito_slug: slug,
        p_revision: profile.revision,
      }),
    );
    assert.equal((await publicAuthor(profileId))[0]?.cafecito_slug, null);
    profile = await readProfile(author.client, profileId);
    assert.equal(profile.cafecito_approved, false);
    assert.equal(profile.decision_note, null);
    succeeded(
      await moderator.client.rpc("article_profile_moderate", {
        p_profile: profileId,
        p_revision: profile.revision,
        p_approved: true,
        p_note: "Firma sintética revisada nuevamente",
      }),
    );
    profile = await readProfile(author.client, profileId);
    succeeded(
      await author.client.rpc("article_profile_save", {
        p_name: profile.display_name,
        p_cafecito_slug: `${slug}-changed`,
        p_revision: profile.revision,
      }),
    );
    assert.equal((await publicAuthor(profileId))[0]?.cafecito_slug, null);
    profile = await readProfile(author.client, profileId);
    succeeded(
      await author.client.rpc("article_profile_save", {
        p_name: profile.display_name,
        p_cafecito_slug: null,
        p_revision: profile.revision,
      }),
    );
    assert.equal(
      (await readProfile(author.client, profileId)).cafecito_slug,
      null,
    );
    console.log(
      "PASS Cafecito approval, name/destination invalidation and removal; no payment request",
    );

    stage = "edits, stale review, withdrawal and restoration";
    const initialRevision = (await readDraft(author.client, articleId))
      .revision;
    const edited: ArticleInput = {
      ...fixture,
      title: `Edición sintética de integración ${runId}`,
      blocks: fixture.blocks.map((block) =>
        block.type === "youtube" ? { ...block, display: "embed" } : block,
      ),
    };
    await save(author.client, edited, articleId);
    assert.equal((await published(articleId))?.data.title, fixture.title);
    assert.deepEqual((await published(articleId))?.data.blocks, fixture.blocks);
    rejected(
      await author.client.rpc("article_save", {
        p_id: articleId,
        p_data: fixture,
        p_revision: initialRevision,
      }),
      "STALE_VERSION",
    );
    await submit(author.client, articleId);
    rejected(
      await moderator.client.rpc("article_moderate", {
        p_article: articleId,
        p_revision: submitted.revision,
        p_decision: "approved",
        p_note: "Revisión sintética obsoleta rechazada",
      }),
      "STALE_VERSION",
    );
    await approve(moderator.client, articleId);
    assert.equal((await published(articleId))?.data.title, edited.title);
    assert.deepEqual((await published(articleId))?.data.blocks, edited.blocks);
    console.log(
      "PASS YouTube link/embed persistence and independent review of presentation changes",
    );
    assert.equal((await published(articleId))?.version, 2);
    await save(author.client, fixture, articleId);
    await submit(author.client, articleId);
    const pending = await readDraft(author.client, articleId);
    succeeded(
      await author.client.rpc("article_withdraw", { p_article: articleId }),
    );
    assert.equal(await published(articleId), null);
    assert.deepEqual(await publicAuthor(profileId), []);
    stage = "anonymous HTTP after withdrawal (404)";
    await checkHttpArticle(articleId, 404, edited.title);
    if (siteOrigin)
      console.log(
        "PASS anonymous HTTP privacy before publication and after withdrawal",
      );
    stage = "edits, stale review, withdrawal and restoration";
    rejected(
      await moderator.client.rpc("article_moderate", {
        p_article: articleId,
        p_revision: pending.revision,
        p_decision: "approved",
        p_note: "Revisión sintética retirada rechazada",
      }),
      "STALE_VERSION",
    );
    const historical = succeeded<{ data: ArticleInput }>(
      await author.client
        .from("article_revisions")
        .select("data")
        .eq("article_id", articleId)
        .eq("version", 1)
        .single(),
    );
    await save(author.client, historical.data, articleId);
    await submit(author.client, articleId);
    await approve(moderator.client, articleId);
    assert.equal((await published(articleId))?.version, 3);
    assert.equal((await published(articleId))?.data.title, fixture.title);
    console.log(
      "PASS published snapshot isolation, stale revisions, withdrawal and reviewed restoration",
    );

    stage = "private reports and moderation withdrawal";
    succeeded(
      await stranger.client.rpc("article_report", {
        p_article: articleId,
        p_reason: "Reporte sintético para comprobar privacidad y retiro",
      }),
    );
    const report = succeeded<{ id: string }>(
      await stranger.client
        .from("article_reports")
        .select("id")
        .eq("article_id", articleId)
        .single(),
    );
    assert.deepEqual(
      succeeded(
        await author.client
          .from("article_reports")
          .select("id")
          .eq("id", report.id),
      ),
      [],
    );
    succeeded(
      await moderator.client.rpc("article_resolve_report", {
        p_report: report.id,
        p_note: "Reporte sintético resuelto con retiro de la publicación",
        p_hide: true,
      }),
    );
    assert.equal(await published(articleId), null);
    assert.deepEqual(await publicAuthor(profileId), []);
    console.log("PASS private reports and moderation withdrawal");
    complete = true;
  } catch {
    console.error(
      `FAIL article integration stage: ${stage}. Provider details withheld.`,
    );
    process.exitCode = 1;
  } finally {
    // Inspect/delete only IDs attempted by this run, verifying both its private marker and synthetic email.
    for (const [id, email] of ownedCandidates) {
      try {
        const found = await admin.auth.admin.getUserById(id);
        const absent =
          found.error?.status === 404 || found.error?.code === "user_not_found";
        if (!absent) {
          const user = found.data.user;
          if (
            found.error ||
            !user ||
            user.id !== id ||
            user.email !== email ||
            user.app_metadata?.article_integration_run !== runId ||
            !email.endsWith("@example.invalid")
          ) {
            cleanupErrors++;
            continue;
          }
          const removed = await admin.auth.admin.deleteUser(id);
          if (removed.error) {
            cleanupErrors++;
            continue;
          }
        }
        // Existing JWTs remain usable until expiry; refresh is disabled. RLS can
        // verify this account's own cascades without granting admin table access.
        const client = authenticatedActors.get(id);
        if (!client) continue; // No application writes happen before successful login.
        const remaining = await Promise.all([
          client
            .from("article_drafts")
            .select("id")
            .eq("author_id", id)
            .limit(1),
          client
            .from("article_profiles")
            .select("id")
            .eq("user_id", id)
            .limit(1),
          client
            .from("article_reports")
            .select("id")
            .eq("author_id", id)
            .limit(1),
        ]);
        for (const result of remaining)
          if (result.error || result.data?.length) cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    // The public role may filter only granted public columns, never auth user IDs.
    for (const id of articleIds) {
      try {
        if ((await published(id)) !== null) cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    for (const id of profileIds) {
      try {
        if ((await publicAuthor(id)).length) cleanupErrors++;
      } catch {
        cleanupErrors++;
      }
    }
    if (cleanupErrors) {
      console.error(
        `Cleanup needs review (${cleanupErrors} operations). Synthetic run reference: ${runId}`,
      );
      process.exitCode = 1;
    } else if (ownedCandidates.size) {
      console.log(
        "PASS cleanup of this run's synthetic accounts and cascading article records",
      );
    }
    if (complete && !cleanupErrors)
      console.log(
        "PASS article integration complete; no email delivery or payment endpoint was invoked",
      );
  }
}

void main().catch(() => {
  console.error(
    "Article integration did not start. Verify --confirm-test, the reviewed test host and the dedicated environment file. Secrets were not printed.",
  );
  process.exitCode = 1;
});
