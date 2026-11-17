import "server-only";
import { getSupabaseConfig, getSupabaseStatus } from "@/lib/supabase/config";
import type { ConnectionStatus } from "@/lib/result";
import { siteUrl } from "@/lib/site-url";

/** Activation is deliberate: an existing Supabase connection alone is insufficient. */
export function getArticleStatus(): ConnectionStatus {
  const enabled = process.env.ARTICLES_ENABLED?.trim();
  if (!enabled || enabled === "false") return "unconfigured";
  if (enabled !== "true") return "unavailable";
  if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) return "unavailable";
  try {
    siteUrl("/articulos");
  } catch {
    return "unavailable";
  }
  const config = getSupabaseConfig();
  if (!config) return getSupabaseStatus();
  const expected = process.env.ARTICLES_EXPECTED_SUPABASE_HOST?.trim();
  if (!expected || new URL(config.url).host !== expected) return "unavailable";
  return "ready";
}
