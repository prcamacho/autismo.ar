import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import {
  getExchangeContext,
  getExchangeReports,
  getModerationQueue,
} from "@/features/exchanges/repository";
import { EXCHANGE_LIMITS } from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  LocationList,
  Status,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import {
  ModerationForm,
  ResolveReportForm,
} from "@/features/exchanges/components/management-forms";
import { ReportEvidence } from "@/features/exchanges/components/report-evidence";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Moderar búsquedas y perfiles",
};
export default async function ModeratePage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const page = readPage((await searchParams).pagina);
  const context = await getExchangeContext();
  if (!context.viewer?.moderator)
    return (
      <ExchangePage
        title="Revisión de publicaciones."
        description="La revisión de pertinencia y privacidad requiere permisos de moderación."
      >
        <ParticipationNotice context={context} />
        {context.viewer && (
          <EmptyPanel title="Esta cuenta no tiene permisos de moderación">
            <Link href="/busquedas" className="text-link">
              Volver a las publicaciones →
            </Link>
          </EmptyPanel>
        )}
      </ExchangePage>
    );
  const [queue, reports] = await Promise.all([
    getModerationQueue(page),
    getExchangeReports(page),
  ]);
  return (
    <ExchangePage
      title="Revisión de búsquedas y perfiles."
      description="Revisá privacidad, pertinencia y datos de presentación. Esta aprobación no certifica calidad ni credenciales profesionales."
    >
      <ExchangeNotice status={queue.status} />
      <Link href="/catalogo/moderar" className="button button-secondary">
        Revisar solicitudes al catálogo
      </Link>
      <section className={styles.stack}>
        <h2>Perfiles pendientes</h2>
        {queue.status === "ready" && queue.data.profiles.length === 0 && (
          <p className={styles.meta}>
            No hay perfiles pendientes en esta página.
          </p>
        )}
        {queue.data.profiles
          .slice(0, EXCHANGE_LIMITS.pageSize)
          .map((profile) => (
            <article key={profile.id} className={styles.card}>
              <h3>{profile.data.name}</h3>
              <p>
                {profile.data.title} ·{" "}
                {profile.data.institution || "Institución no informada"}
              </p>
              <p className={styles.prose}>{profile.data.description}</p>
              <Link href={`/profesionales/${profile.id}`} className="text-link">
                Revisar todos los datos de {profile.data.name} →
              </Link>
              {profile.user_id === context.viewer?.id ? (
                <p className={styles.notice}>
                  Otra persona tiene que revisar tu propio perfil.
                </p>
              ) : (
                <ModerationForm
                  id={profile.id}
                  kind="profile"
                  version={profile.version}
                />
              )}
            </article>
          ))}
      </section>
      <section className={styles.stack}>
        <h2>Publicaciones pendientes</h2>
        {queue.status === "ready" && queue.data.listings.length === 0 && (
          <p className={styles.meta}>
            No hay publicaciones pendientes en esta página.
          </p>
        )}
        {queue.data.listings
          .slice(0, EXCHANGE_LIMITS.pageSize)
          .map((listing) => (
            <article key={listing.id} className={styles.card}>
              <h3>{listing.data.title}</h3>
              <span className={styles.tag}>
                {listing.kind === "offer"
                  ? "Ofrece servicios"
                  : "Busca profesional"}
              </span>
              <p className={styles.prose}>{listing.data.description}</p>
              <LocationList ids={listing.data.locationIds} />
              <Link href={`/busquedas/${listing.id}`} className="text-link">
                Revisar todos los datos de esta publicación →
              </Link>
              {listing.user_id === context.viewer?.id ? (
                <p className={styles.notice}>
                  Otra persona tiene que revisar tu publicación.
                </p>
              ) : (
                <ModerationForm
                  id={listing.id}
                  kind="listing"
                  version={listing.version}
                />
              )}
            </article>
          ))}
      </section>
      <section className={styles.stack}>
        <h2>Reportes</h2>
        <ExchangeNotice status={reports.status} />
        {reports.status === "ready" && reports.data.length === 0 && (
          <p className={styles.meta}>No hay reportes en esta página.</p>
        )}
        {reports.data.slice(0, EXCHANGE_LIMITS.pageSize).map((report) => (
          <article key={report.id} className={styles.card}>
            <h3>
              Reporte de{" "}
              {report.target_kind === "profile"
                ? "perfil"
                : report.target_kind === "listing"
                  ? "publicación"
                  : "conversación"}
            </h3>
            <Status value={report.status === "open" ? "pending" : "closed"} />
            <p className={styles.prose}>{report.reason}</p>
            <ReportEvidence report={report} />
            {report.review_note && (
              <p className={styles.prose}>Resolución: {report.review_note}</p>
            )}
            {report.status === "open" &&
              (report.reporter_id === context.viewer?.id ? (
                <p className={styles.notice}>
                  Otra persona tiene que resolver tu reporte.
                </p>
              ) : (
                <ResolveReportForm id={report.id} />
              ))}
          </article>
        ))}
      </section>
      <Pagination
        page={page}
        hasMore={
          Math.max(
            queue.data.profiles.length,
            queue.data.listings.length,
            reports.data.length,
          ) > EXCHANGE_LIMITS.pageSize
        }
        href="/busquedas/moderar"
      />
    </ExchangePage>
  );
}
