import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { OrientationExplorer } from "@/features/orientation/orientation-explorer";
export const metadata: Metadata = {
  title: "Por dónde empezar",
  description:
    "Buscá fichas del directorio según tu necesidad y ubicación: atención, educación, trámites, traslados y comunidad.",
};
export default function OrientationPage() {
  return (
    <>
      <PageIntro
        eyebrow="Por dónde empezar"
        title="Buscá según lo que necesitás"
        description="Elegí una situación para ver las fichas relacionadas en el directorio. Podés indicar tu provincia y localidad para ajustar los resultados."
      />
      <section className="container section-small">
        <OrientationExplorer />
        <div className="notice">
          <p>
            Si conocés un recurso que todavía no figura, podés{" "}
            <Link href="/aportar" className="text-link">
              aportar información
            </Link>{" "}
            con una fuente consultable.
          </p>
        </div>
      </section>
    </>
  );
}
