import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { OrientationExplorer } from "@/features/orientation/orientation-explorer";
import styles from "@/features/community/community.module.css";
export const metadata: Metadata = {
  title: "Por dónde empezar",
  description:
    "Encontrá recursos a partir de lo que necesitás: atención, educación, trámites, traslados y comunidad.",
};
export default function OrientationPage() {
  return (
    <>
      <PageIntro
        eyebrow="Por dónde empezar"
        title="Contanos qué estás buscando."
        description="No hace falta saber el nombre de un trámite o una especialidad. Elegí la situación que se parece a la tuya y explorá los recursos que la comunidad va reuniendo."
      />
      <section className="container section-small">
        <OrientationExplorer />
        <div className="notice">
          <p>
            Estas preguntas organizan la búsqueda. Si todavía no hay una ficha
            para tu zona, podés{" "}
            <Link href="/aportar" className="text-link">
              preparar un aporte
            </Link>
            . La información se construye entre personas y necesita fuentes.
          </p>
        </div>
        <div className={styles.actions}>
          <Link className="text-link" href="/recursos">
            Explorar también la biblioteca →
          </Link>
        </div>
      </section>
    </>
  );
}
