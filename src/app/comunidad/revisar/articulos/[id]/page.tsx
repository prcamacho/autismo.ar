import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import {
  getDraft,
  getArticle,
  getOwnProfile,
  getRevisions,
} from "@/features/articles/repository";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, readPage } from "@/lib/pagination";
import {
  ArticleConnectionNotice,
  AuthorSignIn,
  draftStatusNames,
} from "@/features/articles/components";
import { ArticleContent } from "@/features/articles/article-content";
import { ReviewControls } from "@/features/articles/review-controls";
import { articleSummary } from "@/features/articles/content";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Revisión de un artículo",
  robots: { index: false, follow: false },
};
export default async function ReviewArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const status = getArticleStatus();
  const viewer = status === "ready" ? await getViewer() : null;
  if (status !== "ready")
    return (
      <div className="container section">
        <ArticleConnectionNotice status={status} />
      </div>
    );
  if (!viewer)
    return (
      <div className="container section">
        <AuthorSignIn />
      </div>
    );
  if (!viewer.moderator) notFound();
  const { id } = await params;
  const result = await getDraft(id);
  if (result.status !== "ready")
    return (
      <div className="container section">
        <ArticleConnectionNotice status={result.status} />
      </div>
    );
  if (!result.data) notFound();
  const draft = result.data;
  const page = readPage((await searchParams).pagina);
  const [published, profile, history] = await Promise.all([
    getArticle(id),
    getOwnProfile(draft.author_id),
    getRevisions(id, page),
  ]);
  return (
    <div className="container section">
      <div className={`${styles.narrow} ${styles.stack}`}>
        <Link href="/comunidad/revisar/articulos" className="text-link">
          ← Volver a pendientes
        </Link>
        <h1>{draft.data.title || "Borrador sin título"}</h1>
        <p>
          {draftStatusNames[draft.status]} · Revisión {draft.revision} · Autor:{" "}
          {profile.data?.display_name || "Perfil no disponible"}
        </p>
        <ArticleConnectionNotice status={profile.status} />
        <p className={styles.lead}>{articleSummary(draft.data)}</p>
        <ArticleContent article={draft.data} preview />
        {draft.status === "submitted" &&
          (draft.author_id === viewer.id ? (
            <p>Otra persona debe revisar tu artículo.</p>
          ) : (
            <section className={styles.card}>
              <h2>Decisión editorial</h2>
              <p>
                Comprobá fuentes, vigencia, privacidad y que la autoría no
                sugiera un respaldo institucional inexistente.
              </p>
              {draft.data.blocks.some((block) => block.type === "youtube") && (
                <p>
                  Revisá también el contenido del video en YouTube, su autoría y
                  la privacidad de quienes aparecen. El sitio no analiza el
                  video automáticamente ni conserva una copia; el contenido
                  externo puede cambiar después de esta revisión.
                </p>
              )}
              <ReviewControls
                id={id}
                revision={draft.revision}
                kind="article"
              />
            </section>
          ))}
        <ArticleConnectionNotice status={published.status} />
        {published.data && (
          <details className={styles.details}>
            <summary>
              Comparar con la versión publicada ({published.data.version})
            </summary>
            <h2>{published.data.data.title}</h2>
            <p>{articleSummary(published.data.data)}</p>
            <ArticleContent article={published.data.data} />
            <Link href={`/articulos/${id}`} className="text-link">
              Abrir página pública
            </Link>
          </details>
        )}
        <section className={styles.stack} aria-labelledby="published-history">
          <h2 id="published-history">Historial de publicaciones</h2>
          <p>
            Conserva las versiones publicadas aunque se hayan retirado. Compará
            su fecha con la del reporte para revisar el contenido de ese
            momento.
          </p>
          <ArticleConnectionNotice status={history.status} />
          {history.status === "ready" && !history.data.length && (
            <p>No hay versiones publicadas en esta página.</p>
          )}
          {history.data.slice(0, PAGE_SIZE).map((item) => (
            <details key={item.version} className={styles.details}>
              <summary>
                Versión {item.version} ·{" "}
                <time dateTime={item.published_at}>
                  {new Date(item.published_at).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </time>
              </summary>
              <h3>{item.data.title}</h3>
              <p>{articleSummary(item.data)}</p>
              <ArticleContent article={item.data} />
            </details>
          ))}
          <Pagination
            page={page}
            hasMore={history.data.length > PAGE_SIZE}
            href={`/comunidad/revisar/articulos/${id}`}
          />
        </section>
      </div>
    </div>
  );
}
