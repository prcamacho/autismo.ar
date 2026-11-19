import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import {
  exchangeClient,
  getExchangeStatus,
  recordExchangeFailure,
} from "@/features/exchanges/server";
import type { QueryResult } from "@/lib/result";
import type { Service, CatalogRequest } from "./model";

export const getServiceCatalog = cache(
  async (): Promise<QueryResult<Service[]>> => {
    const status = getExchangeStatus();
    if (status !== "ready") return { status, data: [] };
    try {
      const client = await exchangeClient();
      if (!client) return { status: "unavailable", data: [] };
      const { data, error } = await client
        .from("service_catalog")
        .select("id,name,group_name,aliases,selectable,source_url")
        .eq("selectable", true)
        .order("name")
        .limit(500);
      if (error) {
        recordExchangeFailure("service_catalog", error.code);
        return { status: "unavailable", data: [] };
      }
      return { status: "ready", data: data ?? [] };
    } catch (error) {
      unstable_rethrow(error);
      recordExchangeFailure("service_catalog");
      return { status: "unavailable", data: [] };
    }
  },
);

export async function getCatalogRequests({
  queue = false,
  page = 1,
  id = "",
} = {}): Promise<QueryResult<CatalogRequest[]>> {
  try {
    const client = await exchangeClient();
    if (!client) return { status: getExchangeStatus(), data: [] };
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) return { status: "ready", data: [] };
    let query = client
      .from("catalog_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20);
    if (queue) query = query.eq("status", "pending");
    else query = query.eq("user_id", user.id);
    if (id) query = query.eq("id", id);
    const { data, error } = await query;
    return { status: error ? "unavailable" : "ready", data: data ?? [] };
  } catch (error) {
    unstable_rethrow(error);
    recordExchangeFailure("catalog_requests");
    return { status: "unavailable", data: [] };
  }
}
