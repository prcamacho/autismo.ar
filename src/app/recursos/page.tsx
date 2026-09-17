import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Smartphone } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { PuzzleMark } from "@/components/puzzle-mark";

export const metadata: Metadata = { title: "Recursos para compartir" };

export default function ResourcesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Biblioteca de recursos"
        title="Lo que ayuda, se comparte."
        description="Un espacio para apps, guías y materiales que puedan acompañar la vida cotidiana, estés donde estés."
      />
      <div className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EL PRIMER PASO</p>
            <h2>Un proyecto propio para empezar</h2>
            <p>
              Esta biblioteca está naciendo. Acá iremos sumando recursos reales.
            </p>
          </div>
          <span className="badge">Alcance nacional</span>
        </div>
        <Link className="resource-feature panel" href="/recursos/app-de-ian">
          <div className="resource-feature-art">
            <PuzzleMark />
          </div>
          <div>
            <span className="badge">
              <Smartphone size={14} /> Proyecto en preparación
            </span>
            <h2>La app de Ian</h2>
            <p>
              Conocé el proyecto de nuestra familia y el espacio donde
              compartiremos su presentación y descarga.
            </p>
            <span className="text-link">
              Ver el proyecto <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>
        <div className="info-grid section-small">
          <article className="info-card">
            <BookOpen className="small-icon" />
            <h3>Guías y orientación</h3>
            <p>
              Preparado para incorporar información con fuentes, fecha de
              revisión y alcance claro.
            </p>
            <span className="badge">Próximamente</span>
          </article>
          <article className="info-card">
            <FileText className="small-icon" />
            <h3>Materiales para el día a día</h3>
            <p>
              PDFs, imprimibles, recetas y apoyos de autores que autoricen
              compartirlos.
            </p>
            <span className="badge">Próximamente</span>
          </article>
          <article className="info-card">
            <Smartphone className="small-icon" />
            <h3>Herramientas digitales</h3>
            <p>
              Un lugar para conocer apps y herramientas, con enlaces a sus
              fuentes originales.
            </p>
            <span className="badge">Próximamente</span>
          </article>
        </div>
        <div className="notice">
          <p>
            ¿Conocés un material útil? Podés preparar un borrador con el enlace
            original. Vamos a incorporar el envío y la revisión de aportes en la
            próxima etapa.
          </p>
          <Link href="/aportar" className="text-link">
            Preparar un aporte <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
