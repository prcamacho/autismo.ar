import type { Metadata } from "next";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import Link from "next/link";
import { findResources } from "@/features/resources/repository";
import { ResourceCard } from "@/features/resources/resource-card";
import { CommunitySteps } from "@/features/community/components";
import { ConnectionNotice } from "@/components/connection-notice";
import styles from "@/components/ui.module.css";

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "Conocé cómo participar en autismo.ar: aportar recursos, proponer correcciones y ayudar a revisar información sobre autismo en Argentina.",
};

export default async function CommunityPage() {
  const resources = await findResources();
  return (
    <>
      <PageIntro
        eyebrow="Comunidad"
        title="Participar en la comunidad"
        description="Aportá recursos, proponé correcciones o ayudá a revisar información. Pueden participar personas autistas, familias y profesionales."
      />
      <section
        className="section-small container"
        aria-labelledby="participar-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="participar-title">Cómo se revisa la información</h2>
          </div>
        </div>
        <CommunitySteps />
        <div className="notice">
          <p>
            Corroborar significa contrastar un dato concreto con una fuente. No
            es un voto de popularidad ni una certificación de calidad clínica.
            La publicidad no compra revisiones ni posiciones en el directorio.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/aportar" className="button">
            Aportar información
          </Link>
          <Link href="/comunidad/revisar" className="button button-secondary">
            Ayudar a revisar
          </Link>
          <Link href="/cuenta" className="text-link">
            Seguir mis aportes →
          </Link>
        </div>
      </section>
      <section
        className="section-small container"
        aria-label="Primeros aportes de la comunidad"
      >
        <div className={styles.stack}>
          <h2>Últimas fichas publicadas</h2>
          <ConnectionNotice status={resources.status} />
          {resources.data.length ? (
            <div className="content-grid">
              {resources.data.slice(0, 6).map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            resources.status !== "unavailable" && (
              <EmptyState
                title="Todavía no hay fichas publicadas"
                description="Si conocés un recurso, podés proponerlo con su fuente para que sea revisado."
                href="/aportar"
                action="Aportar información"
              />
            )
          )}
        </div>
      </section>
      <section
        className="section-small container"
        aria-labelledby="contencion-title"
      >
        <div className="panel">
          <span className="icon-box">
            <HeartHandshake size={25} aria-hidden="true" />
          </span>
          <h2 id="contencion-title">Orientación en salud mental</h2>
          <p>
            El portal de Salud Mental de Argentina ofrece información para la
            comunidad, prevención del suicidio y acceso a una red de servicios.
            autismo.ar todavía no cuenta con atención ni chat de apoyo y no es
            un servicio de emergencias.
          </p>
          <a
            className="text-link"
            href="https://www.argentina.gob.ar/salud/mental-y-adicciones"
            target="_blank"
            rel="noreferrer"
          >
            Consultar recursos oficiales de salud mental{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </div>
      </section>
    </>
  );
}
