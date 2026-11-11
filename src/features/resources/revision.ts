import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { QueryResult } from "@/lib/result";
import type { ResourceRevision } from "./model";

// An exact lookup avoids depending on history pagination or contiguous versions.
export async function readResourceRevision(
  client: SupabaseClient<Database>,
  resourceId: string,
  version: number,
): Promise<QueryResult<ResourceRevision | null>> {
  const { data, error } = await client
    .from("resource_revisions")
    .select("resource_id,version,data,source_url,published_at")
    .eq("resource_id", resourceId)
    .eq("version", version)
    .maybeSingle();
  return { data, status: error ? "unavailable" : "ready" };
}
