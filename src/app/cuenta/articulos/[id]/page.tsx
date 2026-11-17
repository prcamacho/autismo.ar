import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { ActionForm } from "@/components/action-form";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, readPage } from "@/lib/pagination";
import { formatDate } from "@/lib/format";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import {
  getDraft,
  getOwnProfile,
  getRevisions,
  getArticle,
} from "@/features/articles/repository";
import {
  ArticleConnectionNotice,
  ArticleNav,
  AuthorSignIn,
  draftStatusNames,
} from "@/features/articles/components";
import { ArticleEditor } from "@/features/articles/article-editor";
import { ArticleContent } from "@/features/articles/article-content";
import {
  saveArticle,
  submitArticle,
  withdrawArticle,
  restoreArticle,
} from "@/features/articles/actions";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Editar mi artículo",
  robots: { index: false, follow: false },
};
export default async function EditArticlePage({
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
  const { id } = await params;
  const query = await searchParams;
  const page = readPage(query.pagina);
  const result = await getDraft(id);
  if (result.status !== "ready")
    return (
      <div className="container section">
        <ArticleConnectionNotice status={result.status} />
      </div>
    );
  if (!result.data || result.data.author_id !== viewer.id) notFound();
  const draft = result.data;
  const [profile, history, published] = await Promise.all([
    getOwnProfile(viewer.id),
    getRevisions(id, page),
    getArticle(id),
  ]);
  return (
    <>
      <PageIntro
        eyebrow="Mi artículo"
        title={draft.data.title || "Borrador sin título"}
        description="Los cambios se guardan como borrador y requieren una nueva revisión para publicarse."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ArticleNav />
          <div className={styles.callout}>
            <strong>{draftStatusNames[draft.status]}</strong>
            <p>Último guardado: {formatDate(draft.updated_at)}.</p>
            {draft.decision_note && <p>{draft.decision_note}</p>}
            {published.data && (
              <Link className="text-link" href={`/articulos/${id}`}>
                Ver la versión publicada →
              </Link>
            )}
          </div>
          <ArticleConnectionNotice status={profile.status} />
          <ArticleConnectionNotice status={published.status} />
          <ArticleEditor
            key={`${id}-${query.recuperada ?? "editar"}`}
            initial={draft.data}
            id={id}
            revision={draft.revision}
            canSave={true}
            cafecitoAvailable={Boolean(profile.data?.cafecito_approved)}
            saveAction={saveArticle}
          />
          <section className={styles.card} aria-labelledby="send-review-title">
            <h2 id="send-review-title">Enviar a revisión</h2>
            <p>
              Esta acción envía el último borrador guardado. Guardá primero los
              cambios del editor. No publiques datos de menores ni documentación
              médica.
            </p>
            {!profile.data && (
              <Link href="/cuenta/perfil-autor" className="text-link">
                Completá tu perfil de autor antes de enviar
              </Link>
            )}
            {draft.status === "submitted" ? (
              <p>
                El borrador guardado ya está en revisión. Si lo modificás y
                guardás, tendrás que volver a enviarlo.
              </p>
            ) : draft.status === "approved" ? (
              <p>
                Esta versión ya fue aprobada. Guardá los cambios del editor para
                preparar una nueva revisión.
              </p>
            ) : (
              <ActionForm
                action={submitArticle}
                label="Enviar el borrador guardado a revisión"
              >
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="revision" value={draft.revision} />
              </ActionForm>
            )}
          </section>
          {published.data && (
            <details className={styles.details}>
              <summary>Retirar la publicación</summary>
              <p>
                Dejará de estar disponible para lectores. Conservás el borrador
                y las versiones anteriores para recuperarlas; publicar otra vez
                requiere revisión.
              </p>
              <ActionForm
                action={withdrawArticle}
                label="Retirar artículo publicado"
              >
                <input type="hidden" name="id" value={id} />
                <div>
                  <input
                    type="checkbox"
                    name="confirm"
                    id="withdraw-confirm"
                    required
                  />
                  <label htmlFor="withdraw-confirm">
                    Quiero retirar este artículo de la consulta pública
                  </label>
                </div>
              </ActionForm>
            </details>
          )}
          <section className={styles.stack} aria-labelledby="article-history">
            <h2 id="article-history">Versiones publicadas</h2>
            <ArticleConnectionNotice status={history.status} />
            {history.status === "ready" && !history.data.length && (
              <p>Todavía no hay versiones publicadas en esta página.</p>
            )}
            {history.data.slice(0, PAGE_SIZE).map((revision) => (
              <details className={styles.details} key={revision.version}>
                <summary>
                  Versión {revision.version} ·{" "}
                  {formatDate(revision.published_at)}
                </summary>
                <h3>{revision.data.title}</h3>
                <ArticleContent article={revision.data} preview />
                <p>
                  Recuperar esta versión reemplaza el borrador guardado.
                  Descargá primero el borrador actual si querés conservarlo.
                </p>
                <ActionForm
                  action={restoreArticle}
                  label={`Recuperar versión ${revision.version} como borrador`}
                >
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="revision" value={draft.revision} />
                  <input
                    type="hidden"
                    name="version"
                    value={revision.version}
                  />
                </ActionForm>
              </details>
            ))}
            <Pagination
              page={page}
              hasMore={history.data.length > PAGE_SIZE}
              href={`/cuenta/articulos/${id}`}
            />
          </section>
        </div>
      </div>
    </>
  );
}
