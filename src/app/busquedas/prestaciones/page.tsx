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

export default async function BenefitsPreviewPage() {
  await connection();
  if (!isNomenclatorPreviewEnabled()) notFound();
  return <NomenclatorPreview />;
}
