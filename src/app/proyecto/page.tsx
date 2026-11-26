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
    "El propósito de autismo.ar: facilitar el acceso a información y recursos sobre autismo en Argentina, con participación y fuentes claras.",
};

const principles = [
  {
    icon: UsersRound,
    title: "Todas las edades, todas las voces",
    description:
      "Niñez, adolescencia y vida adulta. Las personas autistas tienen voz propia, con lugar para la participación de familias y profesionales.",
  },
  {
    icon: MapPin,
    title: "Cerca tuyo, conectado con el país",
    description:
      "Recursos por provincia y localidad, junto con información nacional. Una misma ficha aparece en las búsquedas que correspondan, sin duplicarse.",
  },
  {
    icon: HeartHandshake,
    title: "Independencia y derechos",
    description:
      "Información sobre derechos, beneficios y trámites con fuentes consultables, sin propaganda partidaria.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza con cuidado",
    description:
      "Fuentes, fechas de revisión y privacidad. Participar no debe exigir exponer diagnósticos, documentación médica ni información de menores.",
  },
];

export default function ProjectPage() {
  return (
    <>
      <PageIntro
        eyebrow="El proyecto"
        title="Sobre autismo.ar"
        description="Información y recursos sobre autismo en Argentina para personas autistas, familias y profesionales."
      />
      <section
        className="section-small container"
        aria-labelledby="vision-title"
      >
        <div className="panel prose">
          <h2 id="vision-title">Qué podés encontrar</h2>
          <p>
            El directorio organiza fichas de profesionales, centros, educación,
            transporte, derechos y comunidad por ubicación. La búsqueda por
            necesidad ayuda a encontrar esas fichas sin conocer una especialidad
            o el nombre de un trámite.
          </p>
          <p>
            Los aportes y las correcciones pasan por revisión antes de
            publicarse, con sus fuentes e historial. Cada sección informa si
            tiene contenido disponible y qué acciones se pueden realizar.
          </p>
          <Link className="text-link" href="/comunidad">
            Cómo participar <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="section container" aria-labelledby="principios-title">
        <div className="section-heading">
          <div>
            <h2 id="principios-title">Principios del proyecto</h2>
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
        aria-labelledby="planes-title"
      >
        <div className="panel prose">
          <h2 id="planes-title">Qué está previsto</h2>
          <p>
            Ampliar la biblioteca y mejorar la revisión comunitaria. También se
            evalúan espacios para emprendimientos familiares, historias que
            personas autistas y familias decidan compartir, y hospedaje
            comunitario para quienes necesitan trasladarse.
          </p>
          <p>
            Estas iniciativas todavía no están habilitadas. El hospedaje y las
            posibles campañas familiares o rifas requieren reglas de privacidad,
            cuidado y funcionamiento antes de abrirse.
          </p>
        </div>
      </section>
      <section className="section container" aria-labelledby="sostener-title">
        <div className="panel prose">
          <h2 id="sostener-title">Sostenimiento del sitio</h2>
          <p>
            En el futuro queremos recibir donaciones para mantener el sitio y
            ofrecer publicidad claramente identificada. Pagar un anuncio nunca
            comprará reputación ni validaciones.
          </p>
          <p>
            Hoy autismo.ar no procesa pagos. Los apoyos a autores que se
            muestren en sus publicaciones se realizan en el servicio externo
            indicado.
          </p>
        </div>
      </section>
      <section
        className="section-small container"
        aria-labelledby="estadisticas-title"
      >
        <div className="panel prose">
          <h2 id="estadisticas-title">Estadísticas de uso</h2>
          <p>
            En autismo.ar usamos PostHog para contar visitas a las secciones
            públicas y entender cuáles resultan útiles. No vinculamos estas
            estadísticas con tu cuenta ni guardamos cookies de analítica. El
            identificador temporal de visita se descarta al recargar o cerrar la
            página.
          </p>
          <p>
            No grabamos sesiones ni enviamos formularios, mensajes, búsquedas
            escritas o datos de perfiles. Las direcciones se envían sin
            parámetros ni identificadores de artículos o personas. Respetamos
            las señales de no rastreo y Control Global de Privacidad del
            navegador. Las estadísticas se procesan en PostHog Cloud, en Estados
            Unidos.
          </p>
        </div>
      </section>
    </>
  );
}
