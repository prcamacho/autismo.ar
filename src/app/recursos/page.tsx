import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import styles from "@/components/ui.module.css";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Biblioteca de autismo.ar en preparación: un espacio para guías, apps y materiales para la vida cotidiana, con fuentes y autorización.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Biblioteca"
        title="Biblioteca"
        description="Guías, materiales y herramientas para la vida cotidiana, con fuentes y autorización para compartirlos."
      />
      <div className="container section-small">
        <div className="panel">
          <h2>Todavía no hay materiales publicados</h2>
          <div className={styles.actions}>
            <Link href="/articulos" className="button">
              Ver artículos
            </Link>
            <Link href="/aportar" className="text-link">
              Aportar información
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
