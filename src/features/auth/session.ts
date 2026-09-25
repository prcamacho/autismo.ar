import "server-only";
import { cache } from "react";
import { createSupabaseClient } from "@/lib/supabase/server";

export const getViewer = cache(async () => {
  const client = await createSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const { data: member } = await client
    .from("community_members")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email,
    moderator: member?.role === "moderator",
  };
});
