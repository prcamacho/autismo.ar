import {
  isAuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function readViewer(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (
      isAuthSessionMissingError(error) ||
      [400, 401, 403].includes(error.status ?? 0)
    )
      return null;
    throw new Error("No pudimos comprobar la sesión. Volvé a intentar.");
  }
  if (!data.user) return null;
  const { data: member, error: membershipError } = await client
    .from("community_members")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (membershipError) {
    throw new Error(
      "No pudimos comprobar los permisos de tu cuenta. Volvé a intentar.",
    );
  }
  return {
    id: data.user.id,
    email: data.user.email,
    moderator: member?.role === "moderator",
  };
}
