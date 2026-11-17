import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import {
  getExchangeContext,
  getExchangeReports,
} from "@/features/exchanges/repository";
import { EXCHANGE_LIMITS } from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { formatInstant } from "@/features/exchanges/components/labels";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Mis reportes y resoluciones",
};
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const page = readPage((await searchParams).pagina);
  const context = await getExchangeContext();
  const result = context.viewer
    ? await getExchangeReports(page, context.viewer.id)
    : { status: context.status, data: [] };
  return (
    <ExchangePage
      title="Mis reportes y resoluciones."
      description="Tus reportes son privados. Podés consultar aquí el motivo de cada resolución."
    >
      <ParticipationNotice context={context} />
      {context.viewer && (
        <>
          <ExchangeNotice status={result.status} />
          {result.status === "ready" && result.data.length === 0 && (
            <EmptyPanel title="No hay reportes en esta página">
              <p>
                Podés reportar problemas desde el perfil, la publicación o la
                conversación correspondiente.
              </p>
            </EmptyPanel>
          )}
          <ul className={styles.list} role="list">
            {result.data.slice(0, EXCHANGE_LIMITS.pageSize).map((report) => (
              <li key={report.id}>
                <article className={styles.card}>
                  <h2>Reporte del {formatInstant(report.created_at)}</h2>
                  <span className={styles.tag}>
                    {report.status === "open"
                      ? "Pendiente de resolución"
                      : "Resuelto"}
                  </span>
                  <p className={styles.prose}>{report.reason}</p>
                  {report.review_note && (
                    <>
                      <h3>Resolución</h3>
                      <p className={styles.prose}>{report.review_note}</p>
                    </>
                  )}
                </article>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            hasMore={result.data.length > EXCHANGE_LIMITS.pageSize}
            href="/busquedas/reportes"
          />
          <Link href="/busquedas/mis-publicaciones" className="text-link">
            Volver a mis publicaciones →
          </Link>
        </>
      )}
    </ExchangePage>
  );
}
