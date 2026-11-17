import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { readPage, PAGE_SIZE } from "@/lib/pagination";
import { listArticles } from "@/features/articles/repository";
import {
  ArticleCard,
  ArticleConnectionNotice,
  ArticleNav,
} from "@/features/articles/components";
import styles from "@/components/ui.module.css";

export const metadata: Metadata = {
  title: "Artículos de la comunidad",
  description:
    "Información, guías y agendas compartidas por la comunidad de autismo.ar.",
};
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const page = readPage((await searchParams).pagina);
  const result = await listArticles(page);
  return (
    <>
      <PageIntro
        eyebrow="Artículos de la comunidad"
        title="Información para leer y compartir."
        description="Publicaciones con autoría, fuentes y fecha de actualización. Consultá la vigencia de los datos y las indicaciones del organismo correspondiente."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ArticleNav />
          <ArticleConnectionNotice status={result.status} />
          {result.status === "ready" && !result.data.length && (
            <div className={styles.card}>
              <h2>
                {page > 1
                  ? "No hay más artículos en esta página"
                  : "Todavía no hay artículos publicados"}
              </h2>
              <p>
                Una guía clara o una agenda con fuentes puede ayudar a otras
                personas.
              </p>
              <Link href="/articulos/nuevo" className="button">
                Preparar un artículo
              </Link>
            </div>
          )}
          <div className="content-grid">
            {result.data.slice(0, PAGE_SIZE).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination
            page={page}
            hasMore={result.data.length > PAGE_SIZE}
            href="/articulos"
          />
        </div>
      </div>
    </>
  );
}
