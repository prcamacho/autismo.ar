import type { ConnectionStatus } from "@/lib/result";
import { parseSupabaseSettings } from "@/lib/supabase/config";

/** Opt-in binding prevents accidentally enabling the module against another environment. */
export function exchangeStatus(
  env: Record<string, string | undefined>,
): ConnectionStatus {
  if (env.EXCHANGES_ENABLED !== "true") return "unconfigured";
  const settings = parseSupabaseSettings(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!settings.config) return "unavailable";
  const url = new URL(settings.config.url);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !loopback) || url.pathname !== "/")
    return "unavailable";
  const expectedHost = env.EXCHANGES_EXPECTED_SUPABASE_HOST?.trim();
  return expectedHost && url.host === expectedHost ? "ready" : "unavailable";
}

export function notificationBudget(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000)
    throw new Error("INVALID_NOTIFICATION_BUDGET");
  return parsed;
}
