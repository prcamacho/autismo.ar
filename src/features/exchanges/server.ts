import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { exchangeStatus } from "./settings";

export function getExchangeStatus() {
  return exchangeStatus(process.env);
}
export async function exchangeClient() {
  return getExchangeStatus() === "ready" ? createSupabaseClient() : null;
}
export function exchangeAdmin() {
  const config = getSupabaseConfig();
  const key = process.env.EXCHANGES_SUPABASE_SECRET_KEY;
  if (getExchangeStatus() !== "ready" || !config || !key) return null;
  return createClient<Database>(config.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export function recordExchangeFailure(operation: string, code = "unknown") {
  // Never include requests, message bodies, images, addresses or provider error text.
  console.error("exchange_operation_failed", {
    operation,
    code: code.slice(0, 60),
  });
}
