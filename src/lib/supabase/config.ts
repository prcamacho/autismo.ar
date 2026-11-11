import type { ConnectionStatus } from "@/lib/result";

export function parseSupabaseSettings(
  rawUrl?: string,
  rawKey?: string,
): {
  status: ConnectionStatus;
  config: { url: string; key: string } | null;
} {
  const url = rawUrl?.trim();
  const key = rawKey?.trim();
  if (!url && !key) return { status: "unconfigured", config: null };
  try {
    if (!url || !key) throw new Error("incomplete");
    const parsed = new URL(url);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    )
      throw new Error("invalid");
    return { status: "ready", config: { url, key } };
  } catch {
    return { status: "unavailable", config: null };
  }
}

function getSettings() {
  return parseSupabaseSettings(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function getSupabaseConfig() {
  return getSettings().config;
}
export function getSupabaseStatus() {
  return getSettings().status;
}
