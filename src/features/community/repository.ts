import "server-only";
import { createSupabaseClient } from "@/lib/supabase/server";
import type { Corroboration, Proposal, QueryResult } from "./model";

const proposalColumns =
  "id,author_id,resource_id,base_version,data,source_url,note,status,decision_note,created_at";
export async function getProposals(
  options: { author?: string; queue?: boolean; page?: number } = {},
): Promise<QueryResult<Proposal[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  const page = options.page || 1;
  let query = client
    .from("community_proposals")
    .select(proposalColumns)
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20);
  if (options.author) query = query.eq("author_id", options.author);
  if (options.queue) query = query.in("status", ["submitted", "reviewing"]);
  const { data, error } = await query;
  return {
    data: (data ?? []) as Proposal[],
    status: error ? "unavailable" : "ready",
  };
}
export async function getProposal(
  id: string,
): Promise<QueryResult<Proposal | null>> {
  const client = await createSupabaseClient();
  if (!client) return { data: null, status: "unconfigured" };
  const { data, error } = await client
    .from("community_proposals")
    .select(proposalColumns)
    .eq("id", id)
    .maybeSingle();
  return {
    data: data as Proposal | null,
    status: error ? "unavailable" : "ready",
  };
}
export async function getChecks(
  id: string,
): Promise<QueryResult<Corroboration[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  const { data, error } = await client
    .from("community_checks")
    .select("id,proposal_id,reviewer_id,field,verdict,source_url,checked_at")
    .eq("proposal_id", id)
    .order("checked_at", { ascending: false })
    .limit(200);
  return {
    data: (data ?? []) as Corroboration[],
    status: error ? "unavailable" : "ready",
  };
}
export type Report = {
  id: string;
  resource_id: string;
  reason: string;
  status: string;
  created_at: string;
  decision_note: string | null;
};
export async function getReports(
  page = 1,
  author?: string,
): Promise<QueryResult<Report[]>> {
  const client = await createSupabaseClient();
  if (!client) return { data: [], status: "unconfigured" };
  let query = client
    .from("community_reports")
    .select("id,resource_id,reason,status,created_at,decision_note")
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20);
  if (author) query = query.eq("author_id", author);
  else query = query.eq("status", "open");
  const { data, error } = await query;
  return {
    data: (data ?? []) as Report[],
    status: error ? "unavailable" : "ready",
  };
}
