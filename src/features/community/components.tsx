import Link from "next/link";
import { ArrowRight, FilePenLine, ScanSearch, History } from "lucide-react";
import {
  proposalStatuses,
  type ConnectionStatus,
  type Proposal,
} from "./model";
import styles from "./community.module.css";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}
export function ConnectionNotice({ status }: { status: ConnectionStatus }) {
  if (status === "ready") return null;
  return (
    <div className={styles.callout} role="status">
      <strong>
        {status === "unconfigured"
          ? "La comunidad está en preparación"
          : "No pudimos cargar la información"}
      </strong>
      <p>
        {status === "unconfigured"
          ? "Estamos habilitando las cuentas y la recepción de aportes. Mientras tanto podés explorar el sitio y preparar un borrador en tu dispositivo."
          : "Puede ser una interrupción temporal. Volvé a intentar en unos minutos; tus aportes guardados no se reemplazan por esta pantalla."}
      </p>
    </div>
  );
}
export function CommunitySteps() {
  return (
    <div className={styles.progress}>
      <div>
        <span>
          <FilePenLine size={20} aria-hidden="true" /> 01 · Aportar
        </span>
        <h3>Un dato con su fuente</h3>
        <p>
          Sumá un recurso o corregí una ficha existente. Primero revisamos que
          pueda compartirse.
        </p>
      </div>
      <div>
        <span>
          <ScanSearch size={20} aria-hidden="true" /> 02 · Corroborar
        </span>
        <h3>Otra mirada, dato por dato</h3>
        <p>
          Otras personas contrastan contactos, ubicación y servicios con una
          fuente.
        </p>
      </div>
      <div>
        <span>
          <History size={20} aria-hidden="true" /> 03 · Mantener
        </span>
        <h3>Información que se cuida</h3>
        <p>
          Una revisión de moderación permite publicar. Cada cambio conserva su
          historial.
        </p>
      </div>
    </div>
  );
}
export function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <article className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.status} data-status={proposal.status}>
          {proposalStatuses[proposal.status].label}
        </span>
        <span className={styles.meta}>{formatDate(proposal.created_at)}</span>
      </div>
      <h3>{proposal.data.name}</h3>
      <p>
        {proposal.base_version > 0
          ? "Propuesta sobre una ficha"
          : "Nuevo recurso"}{" "}
        · {proposal.data.description.slice(0, 180)}
        {proposal.data.description.length > 180 ? "…" : ""}
      </p>
      <Link className="text-link" href={`/comunidad/aportes/${proposal.id}`}>
        Ver aporte <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
export function Pagination({
  page,
  hasMore,
  href,
}: {
  page: number;
  hasMore: boolean;
  href: string;
}) {
  const link = (p: number) =>
    `${href}${href.includes("?") ? "&" : "?"}pagina=${p}`;
  if (page === 1 && !hasMore) return null;
  return (
    <nav className={styles.pager} aria-label="Páginas de resultados">
      {page > 1 && (
        <Link href={link(page - 1)} className="text-link">
          Anterior
        </Link>
      )}
      <span>Página {page}</span>
      {hasMore && (
        <Link href={link(page + 1)} className="text-link">
          Siguiente
        </Link>
      )}
    </nav>
  );
}
export function readPage(value: string | string[] | undefined) {
  const n = Number(typeof value === "string" ? value : "1");
  return Number.isInteger(n) && n >= 1 && n <= 10000 ? n : 1;
}
