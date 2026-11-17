import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, readPage } from "@/lib/pagination";
import { getPublicAuthor, listArticles } from "@/features/articles/repository";
import {
  ArticleCard,
  ArticleConnectionNotice,
} from "@/features/articles/components";
import styles from "@/components/ui.module.css";

export const metadata = { title: "Artículos de un autor" };
export default async function PublicAuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const page = readPage((await searchParams).pagina);
  const author = await getPublicAuthor(id);
  if (author.status !== "ready")
    return (
      <div className="container section">
        <ArticleConnectionNotice status={author.status} />
      </div>
    );
  if (!author.data) notFound();
  const result = await listArticles(page, id);
  return (
    <>
      <PageIntro
        eyebrow="Autor de la comunidad"
        title={author.data.display_name}
        description="Artículos publicados por esta persona. Cada publicación informa sus fuentes y fecha de actualización."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <Link href="/articulos" className="text-link">
            ← Explorar artículos
          </Link>
          <ArticleConnectionNotice status={result.status} />
          <div className="content-grid">
            {result.data.slice(0, PAGE_SIZE).map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
          {result.status === "ready" && !result.data.length && (
            <p>No hay artículos en esta página.</p>
          )}
          <Pagination
            page={page}
            hasMore={result.data.length > PAGE_SIZE}
            href={`/articulos/autores/${id}`}
          />
        </div>
      </div>
    </>
  );
}
