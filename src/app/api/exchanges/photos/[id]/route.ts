import { exchangeAdmin, exchangeClient } from "@/features/exchanges/server";
import { PHOTO_BUCKET } from "@/features/exchanges/photos";
import { uuidSchema } from "@/features/exchanges/validation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return new Response(null, { status: 404, headers });
  const [client, admin] = await Promise.all([
    exchangeClient(),
    Promise.resolve(exchangeAdmin()),
  ]);
  if (!client || !admin) return new Response(null, { status: 503, headers });
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (
    authError &&
    !isAuthSessionMissingError(authError) &&
    ![400, 401, 403].includes(authError.status ?? 0)
  )
    return new Response(null, { status: 503, headers });
  const allowed = await admin.rpc("exchange_photo_access", {
    p_profile: id,
    p_viewer: user?.id ?? null,
  });
  const path = allowed.data?.[0]?.path;
  if (allowed.error || !path)
    return new Response(null, { status: 404, headers });
  const photo = await admin.storage.from(PHOTO_BUCKET).download(path);
  if (photo.error || !photo.data)
    return new Response(null, { status: 404, headers });
  return new Response(photo.data, {
    headers: { ...headers, "Content-Type": "image/webp" },
  });
}
