import { NextRequest } from "next/server";
import {
  getPlaces,
  listDepartments,
  searchPlaces,
} from "@/features/locations/catalog";
import { PROVINCES } from "@/lib/geography";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ids = params.get("ids");
  const headers = {
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  if (ids !== null) {
    const selected = ids.split(",").filter(Boolean);
    if (ids.length > 2500 || selected.length > 30)
      return Response.json(
        { error: "Demasiadas ubicaciones." },
        { status: 400 },
      );
    try {
      return Response.json({ places: getPlaces(selected) }, { headers });
    } catch {
      return Response.json(
        { error: "Una ubicación no pertenece al catálogo." },
        { status: 400 },
      );
    }
  }
  const province = params.get("province") ?? "";
  if (!PROVINCES.some((item) => item.id === province))
    return Response.json(
      { error: "Elegí una provincia válida." },
      { status: 400 },
    );
  return Response.json(
    {
      departments: listDepartments(province),
      places: searchPlaces({
        province,
        departmentId: params.get("department")?.slice(0, 80),
        query: params.get("q")?.slice(0, 160),
        limit: 100,
      }),
    },
    { headers },
  );
}
