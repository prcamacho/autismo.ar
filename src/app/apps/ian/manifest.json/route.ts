import { requireIanLandscape } from "@/lib/ian-orientation";
import { copyIanUpstreamHeaders, getIanAppOrigin } from "@/lib/ian-upstream";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = getIanAppOrigin();
  if (!origin) {
    return Response.json(
      { error: "La app de Ian no está configurada." },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(`${origin}/manifest.json`, {
      cache: "no-store",
      headers: { Accept: "application/manifest+json, application/json" },
    });
    const headers = copyIanUpstreamHeaders(
      upstream,
      "application/manifest+json; charset=UTF-8",
    );

    if (!upstream.ok) {
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    }

    return new Response(
      JSON.stringify(requireIanLandscape(await upstream.json())),
      { status: upstream.status, headers },
    );
  } catch {
    return Response.json(
      { error: "No pudimos cargar el manifiesto de la app de Ian." },
      { status: 502 },
    );
  }
}
