import "server-only";
import { cache } from "react";
import { createSupabaseClient } from "@/lib/supabase/server";
import { readViewer } from "./viewer";

export const getViewer = cache(async () => {
  const client = await createSupabaseClient();
  if (!client) return null;
  return readViewer(client);
});
