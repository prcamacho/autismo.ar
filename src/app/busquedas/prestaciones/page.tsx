import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isNomenclatorPreviewEnabled } from "@/features/nomenclator-preview/availability";
import { NomenclatorPreview } from "@/features/nomenclator-preview/preview";

export const metadata: Metadata = {
  title: "Explorar prestaciones · Vista previa",
  description: "Vista previa del buscador de prestaciones y sus categorías.",
  robots: { index: false, follow: false },
};

export default async function BenefitsPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await connection();
  if (!isNomenclatorPreviewEnabled()) notFound();
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.slice(0, 160).trim() : "";
  return <NomenclatorPreview key={query} initialQuery={query} />;
}
