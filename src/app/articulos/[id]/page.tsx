import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { getArticle, getPublicAuthor } from "@/features/articles/repository";
import { ArticleContent } from "@/features/articles/article-content";
import { ShareControls } from "@/features/articles/share-controls";
import {
  ArticleConnectionNotice,
  CafecitoButton,
} from "@/features/articles/components";
import {
  articleSummary,
  articleHasExpired,
  formatArticleDate,
} from "@/features/articles/content";
import { reportArticle } from "@/features/articles/actions";
import { getViewer } from "@/features/auth/session";
import { ActionForm } from "@/components/action-form";
import { formatDate, currentDateInArgentina } from "@/lib/format";
import { getProvinceName } from "@/lib/geography";
import { siteUrl } from "@/lib/site-url";
import styles from "@/components/ui.module.css";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getArticle(id);
  if (!result.data)
    return {
      title: "Artículo no disponible",
      robots: { index: false, follow: false },
    };
  const article = result.data;
  const description = articleSummary(article.data);
  const url = siteUrl(`/articulos/${id}`);
  return {
    title: article.data.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.data.title,
      description,
      url,
      siteName: "autismo.ar",
      locale: "es_AR",
      publishedTime: article.published_at,
      modifiedTime: article.published_at,
    },
    twitter: { card: "summary", title: article.data.title, description },
  };
}

export default async function PublicArticlePage({ params }: Props) {
  const { id } = await params;
  const result = await getArticle(id);
  if (result.status !== "ready")
    return (
      <div className="container section">
        <ArticleConnectionNotice status={result.status} />
      </div>
    );
  if (!result.data) notFound();
  const article = result.data;
  const [author, session] = await Promise.all([
    getPublicAuthor(article.profile_id),
    getViewer()
      .then((viewer) => ({ viewer, unavailable: false }))
      .catch((error) => {
        unstable_rethrow(error);
        console.error("articles.viewer.unavailable");
        return { viewer: null, unavailable: true };
      }),
  ]);
  return (
    <div className="container section">
      <div className={`${styles.narrow} ${styles.stack}`}>
        <Link href="/articulos" className="text-link">
          ← Volver a artículos
        </Link>
        <header>
          <p className="eyebrow">
            {article.data.kind === "agenda"
              ? "AGENDA DE LA COMUNIDAD"
              : "ARTÍCULO DE LA COMUNIDAD"}
          </p>
          <h1>{article.data.title}</h1>
          <p className={styles.lead}>{articleSummary(article.data)}</p>
          <p className={styles.meta}>
            {author.data ? (
              <Link href={`/articulos/autores/${author.data.id}`}>
                {author.data.display_name}
              </Link>
            ) : (
              "Autor no disponible temporalmente"
            )}{" "}
            · Actualizado {formatDate(article.published_at)} · Versión{" "}
            {article.version}
          </p>
          {article.data.province && (
            <p className={styles.meta}>
              {[getProvinceName(article.data.province), article.data.locality]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </header>
        <ArticleConnectionNotice status={author.status} />
        {article.data.expiresOn && (
          <div className={styles.callout}>
            <strong>
              {articleHasExpired(
                article.data.expiresOn,
                currentDateInArgentina(),
              )
                ? "La vigencia de esta información finalizó"
                : "Información con vigencia informada"}
            </strong>
            <p>
              Hasta el {formatArticleDate(article.data.expiresOn)}. Consultá la
              fuente antes de organizar un trámite o una atención.
            </p>
          </div>
        )}
        <ArticleContent article={article.data} />
        <div className={styles.callout}>
          <p>
            Publicación de su autor. La revisión editorial no certifica calidad
            clínica ni garantiza disponibilidad de turnos. Consultá las fuentes
            y su fecha.
          </p>
        </div>
        <ShareControls
          title={article.data.title}
          summary={articleSummary(article.data)}
          url={siteUrl(`/articulos/${id}`)}
        />
        {article.data.showCafecito && author.data?.cafecito_slug && (
          <CafecitoButton
            slug={author.data.cafecito_slug}
            name={author.data.display_name}
          />
        )}
        <details className={styles.details}>
          <summary>Reportar un problema</summary>
          <p>
            No incluyas documentación médica ni información identificatoria de
            menores. El reporte es privado para vos y moderación.
          </p>
          {session.unavailable ? (
            <p>
              No pudimos comprobar tu sesión para enviar un reporte. Volvé a
              intentar en unos minutos.
            </p>
          ) : session.viewer ? (
            <ActionForm action={reportArticle} label="Enviar reporte">
              <input type="hidden" name="id" value={id} />
              <div className="form-field">
                <label htmlFor="article-report">Qué problema encontraste</label>
                <textarea
                  id="article-report"
                  name="reason"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                />
              </div>
            </ActionForm>
          ) : (
            <Link href="/cuenta" className="text-link">
              Ingresar para reportar
            </Link>
          )}
        </details>
      </div>
    </div>
  );
}
