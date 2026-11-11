import { PAGE_SIZE } from "@/lib/pagination";
import "server-only";
import { createSupabaseClient } from "@/lib/supabase/server";
import { readResourceRevision } from "./revision";
import { getSupabaseStatus } from "@/lib/supabase/config";
import { type QueryResult } from "@/lib/result";
import {
  type ResourceRecord,
  type ResourceRevision,
  type FieldConfirmation,
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
  if (!client) return { data: [], status: getSupabaseStatus() };
  const { data, error } = await client.rpc("community_search", {
    p_query: filters.query || "",
    p_category: filters.category || "",
    p_province: filters.province || "",
    p_locality: filters.locality || "",
    p_age: filters.age || "",
    p_page: filters.page || 1,
  });
  return {
    data: data ?? [],
    status: error ? "unavailable" : "ready",
  };
}
export async function getResource(
  id: string,
): Promise<QueryResult<ResourceRecord | null>> {
  const client = await createSupabaseClient();
  if (!client) return { data: null, status: getSupabaseStatus() };
  const { data, error } = await client
    .from("resources")
    .select("id,slug,version,data,source_url,published_at")
    .eq("slug", id)
    .eq("visible", true)
    .maybeSingle();
  return {
    data,
    status: error ? "unavailable" : "ready",
  };
}
export async function getResourceHistory(
  id: string,
  page = 1,
): Promise<QueryResult<ResourceRevision[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: getSupabaseStatus() };
  const { data, error } = await client
    .from("resource_revisions")
    .select("resource_id,version,data,source_url,published_at")
    .eq("resource_id", id)
    .order("version", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return {
    data: data ?? [],
    status: error ? "unavailable" : "ready",
  };
}
export async function getResourceRevision(id: string, version: number) {
  const client = await createSupabaseClient();
  if (!client) return { data: null, status: getSupabaseStatus() };
  return readResourceRevision(client, id, version);
}
export async function getConfirmations(
  id: string,
): Promise<QueryResult<FieldConfirmation[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: getSupabaseStatus() };
  const { data, error } = await client
    .from("resource_confirmations")
    .select("resource_id,field,source_url,confirmed_at,version")
    .eq("resource_id", id);
  return {
    data: data ?? [],
    status: error ? "unavailable" : "ready",
  };
}
