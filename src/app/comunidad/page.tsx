import type { Metadata } from "next";
import {
  ArrowUpRight,
  HeartHandshake,
  House,
  MessageCircle,
  Store,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import Link from "next/link";
import { findResources } from "@/features/resources/repository";
import { ResourceCard } from "@/features/resources/resource-card";
import {
  CommunitySteps,
  ConnectionNotice,
} from "@/features/community/components";
import styles from "@/features/community/community.module.css";

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "Conocé cómo queremos construir una red de información y apoyo junto a familias y personas autistas de toda Argentina.",
};

const initiatives = [
  {
    icon: Store,
    title: "Emprendimientos familiares",
    description:
      "Un lugar para dar a conocer los productos y servicios que ofrecen las familias de la comunidad.",
  },
  {
    icon: MessageCircle,
    title: "Historias que acompañan",
    description:
      "Experiencias y contenido que familias y personas autistas elijan compartir desde sus propias redes.",
  },
  {
    icon: House,
    title: "Hospedaje comunitario",
    description:
      "Una idea para quienes necesitan trasladarse. Antes de abrirla, definiremos cómo cuidar a quienes ofrecen y reciben ayuda.",
  },
];

export default async function CommunityPage() {
  const resources = await findResources();
  return (
    <>
      <PageIntro
        eyebrow="Comunidad"
        title="Lo que sabés puede ayudar a alguien más."
        description="Un contacto que encontraste, un horario que cambió, una fuente que vale la pena guardar. Entre familias, personas autistas y otros colaboradores construimos información que puede volver a encontrarse."
      />
      <section
        className="section-small container"
        aria-labelledby="participar-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Conocimiento que se construye entre personas
            </p>
            <h2 id="participar-title">Aportar, comprobar y cuidar.</h2>
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
            Sumar un recurso
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
                title="Una comunidad que empieza con pequeños aportes"
                description="Todavía no hay fichas publicadas. Si conocés un recurso que podría servirle a otra persona, podés empezar a preparar la información."
                href="/aportar"
                action="Preparar un aporte"
              />
            )
          )}
        </div>
      </section>
      <section
        className="section container"
        aria-labelledby="iniciativas-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ideas para crecer de a poco</p>
            <h2 id="iniciativas-title">Más formas de estar cerca.</h2>
          </div>
        </div>
        <div className="info-grid">
          {initiatives.map(({ icon: Icon, title, description }) => (
            <article className="info-card" key={title}>
              <span className="icon-box">
                <Icon size={24} aria-hidden="true" />
              </span>
              <span className="badge">A futuro</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
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
          <p className="eyebrow">Contención y orientación</p>
          <h2 id="contencion-title">
            También hay momentos en los que necesitamos apoyo.
          </h2>
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
