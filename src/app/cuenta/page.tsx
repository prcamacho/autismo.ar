import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { getViewer } from "@/features/auth/session";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SignInForm } from "@/features/auth/sign-in-form";
import { signOut } from "@/features/auth/actions";
import { getProposals, getReports } from "@/features/community/repository";
import {
  ConnectionNotice,
  ProposalCard,
  Pagination,
  readPage,
  formatDate,
} from "@/features/community/components";
import styles from "@/features/community/community.module.css";
export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();
  const page = readPage((await searchParams).pagina);
  if (!viewer)
    return (
      <>
        <PageIntro
          eyebrow="Mi cuenta"
          title="Participar empieza con una cuenta."
          description="Podés consultar el directorio sin ingresar. Para aportar o corroborar usamos un código por correo, sin contraseña."
        />
        <div className="container section-small">
          <div className={styles.narrow}>
            {getSupabaseConfig() ? (
              <div className={styles.card}>
                <SignInForm />
              </div>
            ) : (
              <div className={styles.stack}>
                <ConnectionNotice status="unconfigured" />
                <Link href="/aportar" className="button">
                  Preparar un borrador
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  const [proposals, reports] = await Promise.all([
    getProposals({ author: viewer.id, page }),
    getReports(page, viewer.id),
  ]);
  return (
    <>
      <PageIntro
        eyebrow="Mi cuenta"
        title="Tus aportes tienen un recorrido."
        description="Seguí las revisiones, consultá los motivos y ayudá a mantener información útil para otras personas."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <div className={styles.topline}>
            <span className={styles.meta}>
              Sesión: {viewer.email} ·{" "}
              {viewer.moderator ? "Moderación" : "Colaborador/a"}
            </span>
            <form action={signOut}>
              <button className="button button-secondary" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
          <nav className={styles.subnav} aria-label="Participar">
            <Link href="/aportar">Nuevo aporte</Link>
            <Link href="/comunidad/revisar">Ayudar a revisar</Link>
            <Link href="/comunidad">Comunidad</Link>
          </nav>
          <h2>Mis aportes</h2>
          <ConnectionNotice status={proposals.status} />
          {proposals.status === "ready" && proposals.data.length === 0 && (
            <div className={styles.card}>
              <h3>
                {page > 1
                  ? "No hay más aportes en esta página"
                  : "Tu primer aporte puede ser un dato pequeño"}
              </h3>
              <p>
                Un contacto público, una escuela o un servicio que todavía no
                tiene ficha. Buscalo primero en el directorio.
              </p>
              <Link href="/directorio" className="text-link">
                Explorar el directorio →
              </Link>
            </div>
          )}
          <div className="content-grid">
            {proposals.data.slice(0, 20).map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
          <h2>Mis reportes</h2>
          <ConnectionNotice status={reports.status} />
          {reports.status === "ready" && reports.data.length === 0 && (
            <p className={styles.meta}>No hay reportes en esta página.</p>
          )}
          {reports.data.slice(0, 20).map((report) => (
            <article key={report.id} className={styles.card}>
              <span className={styles.status}>
                {report.status === "open"
                  ? "Pendiente de moderación"
                  : "Revisado"}{" "}
                · {formatDate(report.created_at)}
              </span>
              <p>{report.reason}</p>
              {report.decision_note && (
                <p>
                  <strong>Respuesta:</strong> {report.decision_note}
                </p>
              )}
            </article>
          ))}
          <Pagination
            page={page}
            hasMore={proposals.data.length > 20 || reports.data.length > 20}
            href="/cuenta"
          />
        </div>
      </div>
    </>
  );
}
