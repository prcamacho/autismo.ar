import Link from "next/link";
import { ArrowRight, FilePenLine, ScanSearch, History } from "lucide-react";
import { proposalStatuses, type Proposal } from "./model";
import { formatDate } from "@/lib/format";
import styles from "@/components/ui.module.css";

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
