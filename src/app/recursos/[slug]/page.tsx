import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { PuzzleMark } from "@/components/puzzle-mark";

type ResourcePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== "app-de-ian") notFound();

  return {
    title: "App de Ian",
    description:
      "Conocé el proyecto de app de Ian, el primer recurso propio que queremos compartir en autismo.ar.",
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  if (slug !== "app-de-ian") notFound();

  return (
    <>
      <PageIntro
        eyebrow="Biblioteca · Proyecto propio"
        title="La app de Ian"
        description="El primer proyecto que queremos compartir desde autismo.ar. Un punto de partida para reunir herramientas que puedan servir a otras familias."
      />
      <section className="section-small container">
        <div className="content-grid">
          <div className="panel prose">
            <span className="badge">En preparación</span>
            <h2>Un proyecto que nace cerca</h2>
            <p>
              La app de Ian es un proyecto propio de la familia que impulsa
              autismo.ar. Queremos darle un lugar en esta biblioteca y
              compartirlo con quienes puedan encontrarlo útil.
            </p>
            <p>
              Estamos preparando su presentación. Cuando tengamos el material
              listo, esta página contará qué hace la app, cómo se utiliza y
              cuáles son sus requisitos.
            </p>
            <div className="notice">
              <Info size={19} aria-hidden="true" />
              <p>
                La descarga todavía no está disponible. Publicaremos el archivo
                autorizado o su enlace junto con la información necesaria para
                conocer la aplicación.
              </p>
            </div>
          </div>
          <aside className="panel">
            <div className="icon-box">
              <PuzzleMark />
            </div>
            <p className="eyebrow">El inicio de la biblioteca</p>
            <h2>Compartir lo que puede ayudar</h2>
            <p>
              Con el tiempo, este espacio reunirá aplicaciones, guías y
              materiales de sus propios autores o compartidos con autorización.
              Cada recurso tendrá su información y procedencia.
            </p>
            <Link href="/recursos" className="button button-secondary">
              <ArrowLeft size={17} aria-hidden="true" /> Volver a la biblioteca
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
