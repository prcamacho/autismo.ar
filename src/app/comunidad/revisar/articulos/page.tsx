import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ActionForm } from "@/components/action-form";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, readPage } from "@/lib/pagination";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import {
  getArticleQueue,
  getCafecitoQueue,
  listArticleReports,
} from "@/features/articles/repository";
import {
  ArticleConnectionNotice,
  AuthorSignIn,
} from "@/features/articles/components";
import { ReviewControls } from "@/features/articles/review-controls";
import { resolveArticleReport } from "@/features/articles/actions";
import { cafecitoUrl } from "@/features/articles/cafecito";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Revisar artículos",
  robots: { index: false, follow: false },
};
export default async function ArticleModerationPage({
  searchParams,
}: {
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
  if (!viewer.moderator)
    return (
      <div className="container section">
        <h1>Revisión de artículos</h1>
        <p>Tu cuenta no tiene permisos de moderación.</p>
        <Link href="/articulos" className="text-link">
          Explorar artículos
        </Link>
      </div>
    );
  const page = readPage((await searchParams).pagina);
  const [queue, profiles, reports] = await Promise.all([
    getArticleQueue(page),
    getCafecitoQueue(page),
    listArticleReports(page),
  ]);
  return (
    <>
      <PageIntro
        eyebrow="Moderación"
        title="Revisar antes de compartir."
        description="Contrastá fuentes, vigencia, autoría y privacidad. La revisión editorial no certifica calidad clínica ni recepción de aportes."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <Link href="/comunidad/revisar" className="text-link">
            ← Revisión comunitaria
          </Link>
          <section className={styles.stack} aria-labelledby="article-queue">
            <h2 id="article-queue">Artículos pendientes</h2>
            <ArticleConnectionNotice status={queue.status} />
            {queue.status === "ready" && !queue.data.length && (
              <p>No hay artículos pendientes en esta página.</p>
            )}
            {queue.data.slice(0, PAGE_SIZE).map((draft) => (
              <article className={styles.card} key={draft.id}>
                <h3>{draft.data.title}</h3>
                <p>{draft.data.summary}</p>
                <Link
                  href={`/comunidad/revisar/articulos/${draft.id}`}
                  className="text-link"
                >
                  Leer contenido y revisar →
                </Link>
              </article>
            ))}
            <Pagination
              page={page}
              hasMore={queue.data.length > PAGE_SIZE}
              href="/comunidad/revisar/articulos"
            />
          </section>
          <section className={styles.stack} aria-labelledby="cafecito-queue">
            <h2 id="cafecito-queue">Destinos de Cafecito pendientes</h2>
            <ArticleConnectionNotice status={profiles.status} />
            {profiles.status === "ready" && !profiles.data.length && (
              <p>No hay destinos pendientes en esta página.</p>
            )}
            {profiles.data.slice(0, PAGE_SIZE).map((profile) => (
              <article key={profile.id} className={styles.card}>
                <h3>{profile.display_name}</h3>
                <a
                  href={cafecitoUrl(profile.cafecito_slug!)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {cafecitoUrl(profile.cafecito_slug!)}{" "}
                  <span className="sr-only">(abre otra pestaña)</span>
                </a>
                <p>
                  Revisá el destinatario y posibles inconsistencias de
                  identidad. El formato del enlace por sí solo no acredita
                  titularidad.
                </p>
                {profile.user_id === viewer.id ? (
                  <p>Otra persona debe revisar tu enlace.</p>
                ) : (
                  <ReviewControls
                    id={profile.id}
                    revision={profile.revision}
                    kind="cafecito"
                  />
                )}
              </article>
            ))}
            <Pagination
              page={page}
              hasMore={profiles.data.length > PAGE_SIZE}
              href="/comunidad/revisar/articulos"
            />
          </section>
          <section className={styles.stack} aria-labelledby="article-reports">
            <h2 id="article-reports">Reportes pendientes</h2>
            <ArticleConnectionNotice status={reports.status} />
            {reports.status === "ready" && !reports.data.length && (
              <p>No hay reportes pendientes en esta página.</p>
            )}
            {reports.data.slice(0, PAGE_SIZE).map((report) => (
              <article key={report.id} className={styles.card}>
                <p className={styles.meta}>
                  Recibido{" "}
                  <time dateTime={report.created_at}>
                    {new Date(report.created_at).toLocaleString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </time>
                </p>
                <p>{report.reason}</p>
                <Link
                  href={`/comunidad/revisar/articulos/${report.article_id}`}
                  className="text-link"
                >
                  Consultar contenido y versión publicada
                </Link>
                <ActionForm
                  action={resolveArticleReport}
                  label="Resolver reporte"
                >
                  <input type="hidden" name="id" value={report.id} />
                  <div className="form-field">
                    <label htmlFor={`report-note-${report.id}`}>
                      Motivo de la resolución
                    </label>
                    <textarea
                      id={`report-note-${report.id}`}
                      name="note"
                      rows={3}
                      minLength={10}
                      maxLength={1000}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      name="hide"
                      id={`report-hide-${report.id}`}
                    />
                    <label htmlFor={`report-hide-${report.id}`}>
                      Retirar el artículo publicado e invalidar la revisión
                      pendiente
                    </label>
                  </div>
                </ActionForm>
              </article>
            ))}
            <Pagination
              page={page}
              hasMore={reports.data.length > PAGE_SIZE}
              href="/comunidad/revisar/articulos"
            />
          </section>
        </div>
      </div>
    </>
  );
}
