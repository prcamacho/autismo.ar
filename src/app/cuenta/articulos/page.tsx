import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, readPage } from "@/lib/pagination";
import { formatDate } from "@/lib/format";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import { listDrafts, listArticleReports } from "@/features/articles/repository";
import {
  ArticleConnectionNotice,
  ArticleNav,
  AuthorSignIn,
  draftStatusNames,
} from "@/features/articles/components";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Mis artículos",
  robots: { index: false, follow: false },
};
export default async function MyArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const status = getArticleStatus();
  const viewer = status === "ready" ? await getViewer() : null;
  const page = readPage((await searchParams).pagina);
  const [drafts, reports] = viewer
    ? await Promise.all([
        listDrafts(viewer.id, page),
        listArticleReports(page, viewer.id),
      ])
    : [null, null];
  return (
    <>
      <PageIntro
        eyebrow="Mi cuenta"
        title="Tus artículos, paso a paso."
        description="Retomá tus borradores, consultá las revisiones y seguí tus reportes."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ArticleNav />
          <ArticleConnectionNotice status={drafts?.status ?? status} />
          {status === "ready" && !viewer && <AuthorSignIn />}
          {drafts && (
            <>
              <h2>Mis borradores y publicaciones</h2>
              {drafts.status === "ready" && !drafts.data.length && (
                <div className={styles.card}>
                  <h3>Todavía no hay artículos en esta página</h3>
                  <Link href="/articulos/nuevo" className="button">
                    Escribir un artículo
                  </Link>
                </div>
              )}
              <div className="content-grid">
                {drafts.data.slice(0, PAGE_SIZE).map((draft) => (
                  <article className={styles.card} key={draft.id}>
                    <span className={styles.status} data-status={draft.status}>
                      {draftStatusNames[draft.status]}
                    </span>
                    <h3>
                      <Link href={`/cuenta/articulos/${draft.id}`}>
                        {draft.data.title || "Borrador sin título"}
                      </Link>
                    </h3>
                    <p className={styles.meta}>
                      Actualizado {formatDate(draft.updated_at)}
                    </p>
                    {draft.decision_note && <p>{draft.decision_note}</p>}
                    <Link
                      href={`/cuenta/articulos/${draft.id}`}
                      className="text-link"
                    >
                      Abrir borrador →
                    </Link>
                  </article>
                ))}
              </div>
              <Pagination
                page={page}
                hasMore={drafts.data.length > PAGE_SIZE}
                href="/cuenta/articulos"
              />
            </>
          )}
          {reports && (
            <section
              className={styles.stack}
              aria-labelledby="my-article-reports"
            >
              <h2 id="my-article-reports">Mis reportes de artículos</h2>
              <ArticleConnectionNotice status={reports.status} />
              {reports.status === "ready" && !reports.data.length && (
                <p>No hay reportes en esta página.</p>
              )}
              {reports.data.slice(0, PAGE_SIZE).map((report) => (
                <article className={styles.card} key={report.id}>
                  <strong>
                    {report.status === "open"
                      ? "Pendiente de revisión"
                      : "Resuelto"}
                  </strong>
                  <p>{report.reason}</p>
                  {report.decision_note && <p>{report.decision_note}</p>}
                </article>
              ))}
              <Pagination
                page={page}
                hasMore={reports.data.length > PAGE_SIZE}
                href="/cuenta/articulos"
              />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
