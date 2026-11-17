import Link from "next/link";
import { Coffee, ExternalLink, FileText } from "lucide-react";
import type { ConnectionStatus } from "@/lib/result";
import { formatDate, currentDateInArgentina } from "@/lib/format";
import { getProvinceName } from "@/lib/geography";
import { articleHasExpired, articleSummary } from "./content";
import { cafecitoUrl, isCafecitoSlug } from "./cafecito";
import type { ArticleDraft, PublishedArticle } from "./db-contract";
import styles from "@/components/ui.module.css";

export const draftStatusNames: Record<ArticleDraft["status"], string> = {
  draft: "Borrador",
  submitted: "En revisión",
  approved: "Versión aprobada",
  rejected: "Necesita cambios",
};

export function ArticleConnectionNotice({
  status,
}: {
  status: ConnectionStatus;
}) {
  if (status === "ready") return null;
  return (
    <div className={styles.callout} role="status">
      <strong>
        {status === "unconfigured"
          ? "Artículos en preparación"
          : "No pudimos cargar los artículos"}
      </strong>
      <p>
        {status === "unconfigured"
          ? "Podés preparar y descargar un borrador en este dispositivo. El guardado en la cuenta y la publicación todavía no están habilitados en este entorno."
          : "Puede ser una interrupción temporal. Conservá tu borrador y volvé a intentar; esta pantalla no confirma ningún envío."}
      </p>
    </div>
  );
}

export function ArticleNav() {
  return (
    <nav className={styles.subnav} aria-label="Artículos">
      <Link href="/articulos">Explorar artículos</Link>
      <Link href="/articulos/nuevo">Escribir un artículo</Link>
      <Link href="/cuenta/articulos">Mis artículos</Link>
      <Link href="/cuenta/perfil-autor">Mi perfil de autor</Link>
    </nav>
  );
}

export function AuthorSignIn() {
  return (
    <div className={styles.card}>
      <h2>Ingresá a tu cuenta</h2>
      <p>
        Tu cuenta permite guardar borradores, firmar tus artículos y seguir las
        revisiones.
      </p>
      <Link href="/cuenta" className="button">
        Ingresar
      </Link>
      <Link href="/articulos/nuevo" className="text-link">
        Preparar un borrador local
      </Link>
    </div>
  );
}

export function ArticleCard({ article }: { article: PublishedArticle }) {
  const expired = articleHasExpired(
    article.data.expiresOn,
    currentDateInArgentina(),
  );
  return (
    <article className={styles.card}>
      <span className={styles.meta}>
        <FileText size={16} aria-hidden="true" />{" "}
        {article.data.kind === "agenda" ? "Agenda" : "Artículo de la comunidad"}
        {expired ? " · Vigencia finalizada" : ""}
      </span>
      <h2>
        <Link href={`/articulos/${article.id}`}>{article.data.title}</Link>
      </h2>
      <p>{articleSummary(article.data)}</p>
      <p className={styles.meta}>
        {[getProvinceName(article.data.province), article.data.locality]
          .filter(Boolean)
          .join(" · ")}
        {article.data.province ? " · " : ""}Actualizado{" "}
        {formatDate(article.published_at)}
      </p>
      <Link href={`/articulos/${article.id}`} className="text-link">
        Leer artículo →
      </Link>
    </article>
  );
}

export function CafecitoButton({ slug, name }: { slug: string; name: string }) {
  if (!isCafecitoSlug(slug)) return null;
  return (
    <div className={styles.callout}>
      <strong>Apoyar a {name}</strong>
      <p>El apoyo es voluntario y se realiza en su perfil de Cafecito.</p>
      <a
        href={cafecitoUrl(slug)}
        className="button button-secondary"
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
      >
        <Coffee size={18} aria-hidden="true" /> Invitar un Cafecito{" "}
        <ExternalLink size={15} aria-hidden="true" />
        <span className="sr-only"> (abre otra pestaña)</span>
      </a>
      <p className={styles.meta}>Destino: cafecito.app/{slug}</p>
    </div>
  );
}
