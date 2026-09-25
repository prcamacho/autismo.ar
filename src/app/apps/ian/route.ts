import { NextResponse, type NextRequest } from "next/server";
import { buildIanLandscapeShell } from "@/lib/ian-orientation";
import { getIanAppOrigin } from "@/lib/ian-upstream";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  if (request.nextUrl.pathname === "/apps/ian") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = "/apps/ian/";
    return NextResponse.redirect(canonicalUrl, 307);
  }

  const origin = getIanAppOrigin();
  if (!origin) {
    return new Response("La app de Ian no está configurada.", { status: 503 });
  }

  return new Response(buildIanLandscapeShell(origin), {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "text/html; charset=UTF-8",
    },
  });
}
