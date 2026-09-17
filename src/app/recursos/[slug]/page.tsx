import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Info, Smartphone } from "lucide-react";
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
      "Conocé e iniciá la versión beta de la app de Ian desde autismo.ar.",
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
        description="Nuestro primer recurso propio ya está disponible en línea, en versión beta, para usar desde el navegador."
      />
      <section className="section-small container">
        <div className="content-grid">
          <div className="panel prose">
            <span className="badge">
              <Smartphone size={14} aria-hidden="true" /> Disponible en línea
            </span>
            <h2>Un proyecto que nace en familia</h2>
            <p>
              La app de Ian es un proyecto propio de la familia que impulsa
              autismo.ar. Queremos darle un lugar en esta biblioteca y
              compartirlo con quienes puedan encontrarlo útil.
            </p>
            <p>
              Está en etapa beta: puede cambiar mientras seguimos probándola y
              mejorándola. No reemplaza la orientación de profesionales ni
              ofrece indicaciones clínicas.
            </p>
            <a href="/apps/ian/" className="button">
              Iniciar app <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <div className="notice">
              <Info size={19} aria-hidden="true" />
              <p>
                Podés usarla sin instalar nada. Si el navegador ofrece la
                opción, también podés agregarla a tu dispositivo como una app.
              </p>
            </div>
            <h3>Cómo instalarla</h3>
            <ul>
              <li>
                En Android o computadora, abrí el menú del navegador y buscá una
                opción como “Instalar app” o “Agregar a la pantalla de inicio”.
              </li>
              <li>
                En iPhone o iPad, abrí la app en Safari y elegí{" "}
                <strong>Compartir &gt; Agregar a inicio</strong>.
              </li>
            </ul>
            <p>
              La opción y su nombre pueden variar según el dispositivo y el
              navegador. Si no aparece, la app sigue disponible desde el botón
              de esta página.
            </p>
            <div className="resource-attribution">
              <p>
                Los símbolos pictográficos utilizados son propiedad del Gobierno
                de Aragón y han sido creados por Sergio Palao para{" "}
                <a href="https://arasaac.org">ARASAAC (https://arasaac.org)</a>,
                que los distribuye bajo licencia{" "}
                <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es">
                  Creative Commons BY-NC-SA
                </a>
                {"."}
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
              Esta biblioteca comienza con una aplicación disponible y seguirá
              reuniendo guías y materiales de sus propios autores o compartidos
              con autorización. Cada recurso tendrá su información y
              procedencia.
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
