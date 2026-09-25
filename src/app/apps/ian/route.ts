import { NextResponse, type NextRequest } from "next/server";
import { buildIanLandscapeShell } from "@/lib/ian-orientation";
import { copyIanUpstreamHeaders, getIanAppOrigin } from "@/lib/ian-upstream";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (request.nextUrl.pathname === "/apps/ian") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = "/apps/ian/";
    return NextResponse.redirect(canonicalUrl, 307);
  }

  const origin = getIanAppOrigin();
  if (!origin) {
    return new Response("La app de Ian no está configurada.", { status: 503 });
  }

  try {
    const upstreamUrl = new URL("/", `${origin}/`);
    upstreamUrl.search = request.nextUrl.search;
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { Accept: "text/html" },
    });
    const headers = copyIanUpstreamHeaders(
      upstream,
      "text/html; charset=UTF-8",
    );

    if (!upstream.ok) {
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    }

    return new Response(buildIanLandscapeShell(await upstream.text(), origin), {
      status: upstream.status,
      headers,
    });
  } catch {
    return new Response("No pudimos cargar la app de Ian.", { status: 502 });
  }
}
