import "server-only";
import { createSupabaseClient } from "@/lib/supabase/server";
import type { QueryResult } from "@/features/community/model";
import type {
  ResourceRecord,
  ResourceRevision,
  FieldConfirmation,
} from "./model";

export async function findResources(
  filters: {
    query?: string;
    category?: string;
    province?: string;
    locality?: string;
    age?: string;
    page?: number;
  } = {},
): Promise<QueryResult<ResourceRecord[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  const { data, error } = await client.rpc("community_search", {
    p_query: filters.query || "",
    p_category: filters.category || "",
    p_province: filters.province || "",
    p_locality: filters.locality || "",
    p_age: filters.age || "",
    p_page: filters.page || 1,
  });
  return {
    data: (data ?? []) as ResourceRecord[],
    status: error ? "unavailable" : "ready",
  };
}
export async function getResource(
  id: string,
): Promise<QueryResult<ResourceRecord | null>> {
  const client = await createSupabaseClient();
  if (!client) return { data: null, status: "unconfigured" };
  const { data, error } = await client
    .from("resources")
    .select("id,slug,version,data,source_url,published_at")
    .eq("slug", id)
    .eq("visible", true)
    .maybeSingle();
  return {
    data: data as ResourceRecord | null,
    status: error ? "unavailable" : "ready",
  };
}
export async function getResourceHistory(
  id: string,
  page = 1,
): Promise<QueryResult<ResourceRevision[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  const { data, error } = await client
    .from("resource_revisions")
    .select("resource_id,version,data,source_url,published_at")
    .eq("resource_id", id)
    .order("version", { ascending: false })
    .range((page - 1) * 20, page * 20);
  return {
    data: (data ?? []) as ResourceRevision[],
    status: error ? "unavailable" : "ready",
  };
}
export async function getConfirmations(
  id: string,
): Promise<QueryResult<FieldConfirmation[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  const { data, error } = await client
    .from("resource_confirmations")
    .select("resource_id,field,source_url,confirmed_at,version")
    .eq("resource_id", id);
  return {
    data: (data ?? []) as FieldConfirmation[],
    status: error ? "unavailable" : "ready",
  };
}
