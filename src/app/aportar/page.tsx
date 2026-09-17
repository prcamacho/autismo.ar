import type { Metadata } from "next";
import { HeartHandshake, ListChecks, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { ContributionForm } from "@/components/contribution-form";
import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";

export const metadata: Metadata = { title: "Preparar un aporte" };

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category =
    typeof params.categoria === "string" &&
    categories.some((item) => item.id === params.categoria)
      ? params.categoria
      : "";
  const province =
    typeof params.provincia === "string" &&
    PROVINCES.some((item) => item.id === params.provincia)
      ? params.provincia
      : "";
  const locality =
    typeof params.localidad === "string" ? params.localidad.slice(0, 120) : "";
  return (
    <>
      <PageIntro
        eyebrow="Aportar información"
        title="Lo que conocés puede ser una ayuda."
        description="Un contacto, un recurso o un dato actualizado. Cada aporte puede abrirle una puerta a alguien más."
      />
      <div className="container section">
        <div className="notice">
          <HeartHandshake size={25} />
          <div>
            <strong>Estamos preparando la recepción de aportes.</strong>
            <p>
              Por ahora podés completar y descargar un borrador. Cuando
              habilitemos las cuentas y la revisión comunitaria, podrás enviar
              tu información.
            </p>
          </div>
        </div>
        <div className="contribution-layout section-small">
          <ContributionForm
            initialCategory={category}
            initialProvince={province}
            initialLocality={locality}
          />
          <aside className="contribution-aside">
            <div className="info-card">
              <ListChecks className="small-icon" />
              <h3>Un buen aporte tiene contexto</h3>
              <p>
                Incluí el nombre, la ubicación y una fuente. Separá lo que
                conocés de primera mano de lo que todavía necesita confirmación.
              </p>
            </div>
            <div className="info-card">
              <ShieldCheck className="small-icon" />
              <h3>Cuidemos la privacidad</h3>
              <p>
                No necesitamos diagnósticos, datos de niños ni historias
                clínicas. La información de contacto debe ser pública y del
                recurso que compartís.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
