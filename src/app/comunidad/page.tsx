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

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "Conocé cómo queremos construir una red de información y apoyo junto a familias y personas autistas de toda Argentina.",
};

const steps = [
  {
    title: "Compartir lo que conocés",
    description:
      "Un contacto, un recurso o una corrección pueden facilitarle el camino a alguien más. Cada aporte tendrá su fuente y su lugar.",
  },
  {
    title: "Corroborar entre personas",
    description:
      "Otros colaboradores podrán comprobar datos concretos. Confirmar un horario o un teléfono no equivale a recomendar la calidad de un servicio.",
  },
  {
    title: "Mantenerlo vigente",
    description:
      "Queremos mostrar cuándo se revisó cada dato y facilitar las actualizaciones. La información útil también necesita cuidado con el tiempo.",
  },
];

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

export default function CommunityPage() {
  return (
    <>
      <PageIntro
        eyebrow="Comunidad"
        title="Lo que sabés puede ayudar a alguien más."
        description="Imaginamos una red donde las familias y las personas autistas puedan compartir recursos, hacerse escuchar y acompañarse en cada etapa de la vida."
      />
      <section
        className="section-small container"
        aria-labelledby="participar-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">La participación que estamos preparando</p>
            <h2 id="participar-title">Aportar, comprobar y cuidar.</h2>
          </div>
        </div>
        <div className="info-grid steps">
          {steps.map((step, index) => (
            <article className="info-card" key={step.title}>
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <div className="notice">
          <p>
            Los aportes y las corroboraciones todavía no están habilitados. Más
            adelante habrá niveles que reconozcan contribuciones útiles y
            confirmadas, con reglas para prevenir abusos.
          </p>
        </div>
      </section>
      <section
        className="section-small container"
        aria-label="Primeros aportes de la comunidad"
      >
        <EmptyState
          title="Una comunidad que empieza con pequeños aportes"
          description="Todavía no hay publicaciones. Si conocés un recurso que podría servirle a otra persona, podés empezar a preparar la información."
        />
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
