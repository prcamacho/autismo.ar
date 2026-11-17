import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readViewer } from "@/features/auth/viewer";
import type { Database } from "@/lib/supabase/database.types";
import type { QueryResult } from "@/lib/result";
import type {
  ConversationRow,
  ExchangeReport,
  ListingRow,
  ListingView,
  MessageRow,
  ProfileRow,
  ProfileView,
} from "./db-contract";
import { EXCHANGE_LIMITS } from "./model";
import {
  exchangeClient,
  getExchangeStatus,
  recordExchangeFailure,
} from "./server";
import { uuidSchema } from "./validation";

type Account = Database["public"]["Tables"]["exchange_accounts"]["Row"];
type Client = SupabaseClient<Database>;
type Response<T> = { data: T | null; error: { code?: string } | null };
const windowFor = (page = 1): [number, number] => {
  const safe = Number.isInteger(page) && page > 0 && page <= 10000 ? page : 1;
  const start = (safe - 1) * EXCHANGE_LIMITS.pageSize;
  return [start, start + EXCHANGE_LIMITS.pageSize];
};

async function read<T>(
  operation: string,
  empty: T,
  query: (client: Client) => PromiseLike<Response<T>>,
): Promise<QueryResult<T>> {
  const status = getExchangeStatus();
  if (status !== "ready") return { status, data: empty };
  try {
    const client = await exchangeClient();
    if (!client) return { status: "unavailable", data: empty };
    const result = await query(client);
    if (result.error) {
      recordExchangeFailure(operation, result.error.code);
      return { status: "unavailable", data: empty };
    }
    return { status: "ready", data: result.data ?? empty };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure(operation);
    return { status: "unavailable", data: empty };
  }
}

export const getExchangeContext = cache(async () => {
  const status = getExchangeStatus();
  const empty = { status, viewer: null, account: null, photosAvailable: false };
  if (status !== "ready") return empty;
  try {
    const client = await exchangeClient();
    if (!client) return { ...empty, status: "unavailable" as const };
    const viewer = await readViewer(client);
    let account: Account | null = null;
    if (viewer) {
      const result = await client
        .from("exchange_accounts")
        .select("user_id,adult_confirmed_at,notifications")
        .eq("user_id", viewer.id)
        .maybeSingle();
      if (result.error)
        return { ...empty, viewer, status: "unavailable" as const };
      account = result.data;
    }
    return {
      status,
      viewer,
      account,
      photosAvailable: Boolean(process.env.EXCHANGES_SUPABASE_SECRET_KEY),
    };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("context");
    return { ...empty, status: "unavailable" as const };
  }
});

export async function getOwnProfile() {
  const { viewer, status } = await getExchangeContext();
  if (!viewer) return { data: null, status };
  return read<ProfileRow | null>("own_profile", null, (client) =>
    client
      .from("exchange_profiles")
      .select("*")
      .eq("user_id", viewer.id)
      .maybeSingle(),
  );
}
export async function getProfile(
  id: string,
): Promise<QueryResult<ProfileView | null>> {
  if (!uuidSchema.safeParse(id).success) return { data: null, status: "ready" };
  const result = await read<ProfileView[]>("profile", [], (client) =>
    client.rpc("exchange_profile", { p_id: id }),
  );
  return { ...result, data: result.data[0] ?? null };
}
export type ListingFilters = {
  kind?: string;
  service?: string;
  province?: string;
  place?: string;
  modality?: string;
  availability?: string;
  page?: number;
};
export async function searchListings(filters: ListingFilters = {}) {
  return read<ListingView[]>("search", [], (client) =>
    client.rpc("exchange_search", {
      p_kind: filters.kind === "request" ? "request" : "offer",
      p_service: filters.service?.slice(0, 60) ?? "",
      p_province: filters.province?.slice(0, 60) ?? "",
      p_place: filters.place?.slice(0, 80) ?? "",
      p_modality: filters.modality?.slice(0, 30) ?? "",
      p_availability: filters.availability?.slice(0, 30) ?? "",
      p_page:
        Math.floor(windowFor(filters.page)[0] / EXCHANGE_LIMITS.pageSize) + 1,
    }),
  );
}
export async function getListing(
  id: string,
): Promise<QueryResult<ListingView | null>> {
  if (!uuidSchema.safeParse(id).success) return { data: null, status: "ready" };
  const result = await read<ListingView[]>("listing", [], (client) =>
    client.rpc("exchange_listing", { p_id: id }),
  );
  return { ...result, data: result.data[0] ?? null };
}
export async function getOwnListings(page = 1) {
  const { viewer, status } = await getExchangeContext();
  if (!viewer) return { data: [] as ListingRow[], status };
  return read<ListingRow[]>("own_listings", [], (client) =>
    client
      .from("exchange_listings")
      .select("*")
      .eq("user_id", viewer.id)
      .order("updated_at", { ascending: false })
      .order("id")
      .range(...windowFor(page)),
  );
}
export async function getConversations(page = 1) {
  const { viewer, status } = await getExchangeContext();
  if (!viewer) return { data: [] as ConversationRow[], status };
  return read<ConversationRow[]>("conversations", [], (client) =>
    client
      .from("exchange_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("id")
      .range(...windowFor(page)),
  );
}
export async function getConversation(
  id: string,
  page = 1,
): Promise<
  QueryResult<{
    conversation: ConversationRow;
    messages: MessageRow[];
    blocked: boolean;
  } | null>
> {
  if (!uuidSchema.safeParse(id).success) return { data: null, status: "ready" };
  const row = await read<ConversationRow | null>(
    "conversation",
    null,
    (client) =>
      client
        .from("exchange_conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle(),
  );
  if (!row.data) return { status: row.status, data: null };
  const conversation = row.data;
  const [messages, blocks] = await Promise.all([
    read<MessageRow[]>("messages", [], (client) =>
      client
        .from("exchange_messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(...windowFor(page)),
    ),
    read<{ blocker_id: string; blocked_id: string }[]>("blocks", [], (client) =>
      client
        .from("exchange_blocks")
        .select("blocker_id,blocked_id")
        .in("blocker_id", [conversation.sender_id, conversation.recipient_id])
        .in("blocked_id", [conversation.sender_id, conversation.recipient_id]),
    ),
  ]);
  if (messages.status !== "ready" || blocks.status !== "ready")
    return { data: null, status: "unavailable" };
  return {
    status: "ready",
    data: {
      conversation,
      messages: messages.data,
      blocked: blocks.data.length > 0,
    },
  };
}
export async function getModerationQueue(
  page = 1,
): Promise<QueryResult<{ profiles: ProfileRow[]; listings: ListingRow[] }>> {
  const { viewer, status } = await getExchangeContext();
  if (!viewer?.moderator)
    return { status, data: { profiles: [], listings: [] } };
  const [profiles, listings] = await Promise.all([
    read<ProfileRow[]>("review_profiles", [], (client) =>
      client
        .from("exchange_profiles")
        .select("*")
        .eq("status", "pending")
        .order("updated_at")
        .order("id")
        .range(...windowFor(page)),
    ),
    read<ListingRow[]>("review_listings", [], (client) =>
      client
        .from("exchange_listings")
        .select("*")
        .eq("status", "pending")
        .order("updated_at")
        .order("id")
        .range(...windowFor(page)),
    ),
  ]);
  return {
    status:
      profiles.status === "ready" && listings.status === "ready"
        ? "ready"
        : "unavailable",
    data: { profiles: profiles.data, listings: listings.data },
  };
}
export async function getExchangeReports(page = 1, reporterId?: string) {
  return read<ExchangeReport[]>("reports", [], (client) => {
    let query = client.from("exchange_reports").select("*");
    if (reporterId) query = query.eq("reporter_id", reporterId);
    return query
      .order("created_at", { ascending: false })
      .order("id")
      .range(...windowFor(page));
  });
}
