import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "El proyecto",
  description:
    "La visión de autismo.ar: información local confiable, recursos compartidos y una comunidad que crece paso a paso.",
};

const principles = [
  {
    icon: UsersRound,
    title: "Todas las edades, todas las voces",
    description:
      "Niñez, adolescencia y vida adulta. Un espacio para las familias y también para que las personas autistas participen y hablen desde su propia experiencia.",
  },
  {
    icon: MapPin,
    title: "Cerca tuyo, conectado con el país",
    description:
      "Recursos por provincia y localidad, junto con información nacional. Una misma ficha podrá aparecer donde sea útil sin multiplicar versiones.",
  },
  {
    icon: HeartHandshake,
    title: "Independencia y derechos",
    description:
      "Sin banderas partidarias. Los derechos, beneficios y trámites tendrán lugar con sus fuentes, para que la información pueda servir a todos.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza con cuidado",
    description:
      "Fuentes, fechas de revisión y privacidad. Participar no debe exigir exponer diagnósticos, documentación médica ni información de menores.",
  },
];

const stages = [
  {
    label: "Ahora",
    title: "Dar forma a la casa",
    description:
      "Podés explorar por necesidad, buscar por ubicación y preparar un aporte. El circuito comunitario está construido y su activación se informa en las pantallas de cuenta y participación.",
  },
  {
    label: "Después",
    title: "Probar con una comunidad cercana",
    description:
      "Sumar los primeros recursos verificables en una zona, habilitar cuentas y aportes, y aprender junto a un pequeño grupo cómo revisar y corregir la información.",
  },
  {
    label: "Más adelante",
    title: "Crecer con confianza",
    description:
      "Mejorar la revisión con lo aprendido, incorporar niveles y nuevas localidades. Ampliar la biblioteca, dar visibilidad a emprendimientos y preparar formas transparentes de sostener el proyecto.",
  },
];

export default function ProjectPage() {
  return (
    <>
      <PageIntro
        eyebrow="El proyecto"
        title="Compartir el camino, desde el principio."
        description="Queremos que lo que una familia aprendió con esfuerzo pueda facilitarle el recorrido a otra. Así empieza autismo.ar."
      />
      <section
        className="section-small container"
        aria-labelledby="vision-title"
      >
        <div className="panel prose">
          <p className="eyebrow">Una idea que construimos juntos</p>
          <h2 id="vision-title">
            Encontrar ayuda no debería depender de conocer a la persona
            indicada.
          </h2>
          <p>
            Imaginamos una red de profesionales, centros, escuelas, transporte,
            beneficios y recursos cotidianos, organizada para encontrar lo que
            sirve cerca de casa.
          </p>
          <p>
            Las personas podrán aportar información, proponer cambios y
            corroborar datos de otros. Queremos que la comunidad ayude a
            mantener la red, con herramientas claras y revisión humana cuando
            haga falta.
          </p>
        </div>
      </section>
      <section className="section container" aria-labelledby="principios-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Lo que nos orienta</p>
            <h2 id="principios-title">Una red útil y respetuosa.</h2>
          </div>
        </div>
        <div className="content-grid">
          {principles.map(({ icon: Icon, title, description }) => (
            <article className="info-card" key={title}>
              <span className="icon-box">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="section-small container"
        aria-labelledby="etapas-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Paso a paso</p>
            <h2 id="etapas-title">
              Empezamos pequeño, pensamos a largo plazo.
            </h2>
          </div>
        </div>
        <div className="info-grid">
          {stages.map(({ label, title, description }) => (
            <article className="info-card" key={label}>
              <span className="badge">{label}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section container" aria-labelledby="sostener-title">
        <div className="panel prose">
          <p className="eyebrow">Un proyecto que pueda sostenerse</p>
          <h2 id="sostener-title">Crecer también es cuidar la confianza.</h2>
          <p>
            En el futuro queremos recibir donaciones para mantener el sitio y
            ofrecer publicidad claramente identificada. Pagar un anuncio nunca
            comprará reputación ni validaciones.
          </p>
          <p>
            Las posibles campañas de ayuda a familias tendrán un circuito
            propio. El hospedaje comunitario y las rifas necesitan resolver sus
            condiciones antes de habilitarse. Hoy no se reciben pagos desde esta
            web.
          </p>
          <Link className="text-link" href="/comunidad">
            Conocé cómo imaginamos la comunidad{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
