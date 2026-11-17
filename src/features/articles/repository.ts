import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/pagination";
import type { QueryResult } from "@/lib/result";
import { getArticleStatus } from "./config";
import type {
  ArticleDraft,
  ArticleProfile,
  ArticleReport,
  ArticleRevision,
  PublishedArticle,
  PublicArticleAuthor,
} from "./db-contract";

type Client = NonNullable<Awaited<ReturnType<typeof createSupabaseClient>>>;
type Response<T> = { data: T | null; error: { code?: string } | null };
const uuid = z.uuid();
const publishedColumns = "id,profile_id,data,version,published_at,visible";

async function query<T>(
  fallback: T,
  run: (client: Client) => PromiseLike<Response<T>>,
): Promise<QueryResult<T>> {
  const status = getArticleStatus();
  if (status !== "ready") return { data: fallback, status };
  try {
    const client = await createSupabaseClient();
    if (!client) return { data: fallback, status: "unavailable" };
    const result = await run(client);
    if (result.error) {
      console.error("articles.query.failed", { code: result.error.code });
      return { data: fallback, status: "unavailable" };
    }
    return { data: result.data ?? fallback, status: "ready" };
  } catch (error) {
    unstable_rethrow(error);
    console.error("articles.query.unavailable");
    return { data: fallback, status: "unavailable" };
  }
}

export function listArticles(page = 1, profileId?: string) {
  if (profileId && !uuid.safeParse(profileId).success)
    return Promise.resolve({ data: [], status: "ready" as const });
  return query<PublishedArticle[]>([], (client) => {
    let request = client
      .from("articles")
      .select(publishedColumns)
      .eq("visible", true);
    if (profileId) request = request.eq("profile_id", profileId);
    return request
      .order("published_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  });
}

export const getArticle = cache(
  async (id: string): Promise<QueryResult<PublishedArticle | null>> => {
    if (!uuid.safeParse(id).success) return { data: null, status: "ready" };
    return query<PublishedArticle | null>(null, (client) =>
      client
        .from("articles")
        .select(publishedColumns)
        .eq("id", id)
        .eq("visible", true)
        .maybeSingle(),
    );
  },
);

export async function getPublicAuthor(
  id: string,
): Promise<QueryResult<PublicArticleAuthor | null>> {
  if (!uuid.safeParse(id).success) return { data: null, status: "ready" };
  const result = await query<PublicArticleAuthor[]>([], (client) =>
    client.rpc("article_author", { p_id: id }),
  );
  return { data: result.data[0] ?? null, status: result.status };
}

export function getOwnProfile(userId: string) {
  return query<ArticleProfile | null>(null, (client) =>
    client
      .from("article_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  );
}

export function listDrafts(userId: string, page = 1) {
  return query<ArticleDraft[]>([], (client) =>
    client
      .from("article_drafts")
      .select("*")
      .eq("author_id", userId)
      .order("updated_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );
}

export function getDraft(id: string) {
  if (!uuid.safeParse(id).success)
    return Promise.resolve({ data: null, status: "ready" as const });
  return query<ArticleDraft | null>(null, (client) =>
    client.from("article_drafts").select("*").eq("id", id).maybeSingle(),
  );
}

export function getRevisions(id: string, page = 1) {
  return query<ArticleRevision[]>([], (client) =>
    client
      .from("article_revisions")
      .select("*")
      .eq("article_id", id)
      .order("version", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );
}

export function getArticleQueue(page = 1) {
  return query<ArticleDraft[]>([], (client) =>
    client
      .from("article_drafts")
      .select("*")
      .eq("status", "submitted")
      .order("updated_at", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );
}

export function getCafecitoQueue(page = 1) {
  return query<ArticleProfile[]>([], (client) =>
    client
      .from("article_profiles")
      .select("*")
      .eq("cafecito_approved", false)
      .not("cafecito_slug", "is", null)
      .is("decision_note", null)
      .order("updated_at", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );
}

export function listArticleReports(page = 1, userId?: string) {
  return query<ArticleReport[]>([], (client) => {
    let request = client.from("article_reports").select("*");
    if (userId) request = request.eq("author_id", userId);
    else request = request.eq("status", "open");
    return request
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  });
}
