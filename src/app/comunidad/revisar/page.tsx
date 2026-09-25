import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { getViewer } from "@/features/auth/session";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getProposals, getReports } from "@/features/community/repository";
import {
  ConnectionNotice,
  ProposalCard,
  Pagination,
  readPage,
  formatDate,
} from "@/features/community/components";
import { ActionForm } from "@/features/community/action-form";
import { resolveReport } from "@/features/community/actions";
import styles from "@/features/community/community.module.css";
export const metadata = {
  title: "Ayudar a revisar",
  robots: { index: false, follow: false },
};
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();
  const page = readPage((await searchParams).pagina);
  const proposals = viewer ? await getProposals({ queue: true, page }) : null;
  const reports = viewer?.moderator ? await getReports(page) : null;
  return (
    <>
      <PageIntro
        eyebrow="Revisión comunitaria"
        title="Otra mirada hace la diferencia."
        description="Consultá una fuente y contrastá un dato. Si encontrás diferencias, dejalas señaladas para que puedan resolverse antes de publicar."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <nav className={styles.subnav} aria-label="Comunidad">
            <Link href="/comunidad">Comunidad</Link>
            <Link href="/cuenta">Mis aportes</Link>
          </nav>
          {!viewer ? (
            <>
              <ConnectionNotice
                status={getSupabaseConfig() ? "ready" : "unconfigured"}
              />
              <div className={styles.card}>
                <h2>Ingresá para participar de la revisión</h2>
                <p>
                  Los aportes pasan primero por moderación. La cuenta permite
                  conservar quién revisó cada dato y evitar autovalidaciones.
                </p>
                <Link href="/cuenta" className="button">
                  Ir a mi cuenta
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className={styles.callout}>
                <strong>
                  {viewer.moderator
                    ? "Tu cuenta tiene permisos de moderación"
                    : "Revisá solo lo que puedas comprobar"}
                </strong>
                <p>
                  {viewer.moderator
                    ? "Antes de habilitar un aporte, revisá privacidad, pertinencia, fuentes y posibles duplicados. Publicar exige corroboraciones independientes de todos los datos nuevos o modificados."
                    : "No corrobores recursos propios o con los que tengas un conflicto de interés. Los datos que cambian requieren una fuente actual."}
                </p>
              </div>
              {proposals && (
                <>
                  <ConnectionNotice status={proposals.status} />
                  {proposals.status === "ready" &&
                    proposals.data.length === 0 && (
                      <div className={styles.card}>
                        <h2>No hay aportes para revisar en esta página</h2>
                        <p>
                          Podés sumar un recurso o volver más adelante para
                          ayudar a contrastar los próximos aportes.
                        </p>
                        <Link href="/aportar" className="text-link">
                          Preparar un aporte →
                        </Link>
                      </div>
                    )}
                  <div className="content-grid">
                    {proposals.data.slice(0, 20).map((p) => (
                      <ProposalCard key={p.id} proposal={p} />
                    ))}
                  </div>
                </>
              )}
              {reports && (
                <section className={styles.stack}>
                  <h2>Reportes pendientes</h2>
                  <ConnectionNotice status={reports.status} />
                  {reports.status === "ready" && reports.data.length === 0 && (
                    <p className={styles.meta}>
                      No hay reportes pendientes en esta página.
                    </p>
                  )}
                  {reports.data.slice(0, 20).map((report) => (
                    <article className={styles.card} key={report.id}>
                      <span className={styles.meta}>
                        {formatDate(report.created_at)}
                      </span>
                      <p>{report.reason}</p>
                      <Link
                        href={`/directorio/${report.resource_id}`}
                        className="text-link"
                      >
                        Consultar ficha →
                      </Link>
                      <ActionForm
                        action={resolveReport}
                        label="Guardar resolución"
                      >
                        <input type="hidden" name="report" value={report.id} />
                        <div className="form-field">
                          <label htmlFor={`report-${report.id}`}>
                            Motivo y resolución (lo verá quien reportó)
                          </label>
                          <textarea
                            id={`report-${report.id}`}
                            name="note"
                            minLength={10}
                            maxLength={1000}
                            required
                            rows={3}
                          />
                        </div>
                        <label className={styles.choice}>
                          <input type="checkbox" name="hide" />
                          Retirar la ficha y su historial del acceso público por
                          este problema.
                        </label>
                      </ActionForm>
                    </article>
                  ))}
                </section>
              )}
              <Pagination
                page={page}
                hasMore={Boolean(
                  (proposals?.data.length || 0) > 20 ||
                  (reports?.data.length || 0) > 20,
                )}
                href="/comunidad/revisar"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
