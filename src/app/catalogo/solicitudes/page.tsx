import Link from "next/link";
import { getExchangeContext } from "@/features/exchanges/repository";
import {
  ExchangePage,
  ExchangeNotice,
  EmptyPanel,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { getCatalogRequests } from "@/features/services/repository";
import { readPage } from "@/lib/pagination";
import { Pagination } from "@/components/pagination";
import styles from "@/features/exchanges/exchanges.module.css";
export const metadata = {
  ...privateMetadata,
  title: "Mis solicitudes al catálogo",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const page = readPage((await searchParams).pagina);
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getCatalogRequests({ page }),
  ]);
  return (
    <ExchangePage
      title="Mis solicitudes al catálogo"
      description="Consultá las respuestas y retomá tus borradores privados."
      current="/catalogo/solicitudes"
    >
      <ParticipationNotice context={context} />
      <ExchangeNotice status={result.status} />
      <div className={styles.actions}>
        <Link className="button" href="/catalogo/solicitar">
          Pedir una opción
        </Link>
        {context.viewer?.moderator && (
          <Link href="/catalogo/moderar">Revisar solicitudes</Link>
        )}
      </div>
      {context.viewer &&
        result.status === "ready" &&
        result.data.length === 0 && (
          <EmptyPanel title="Todavía no enviaste solicitudes">
            <p>Si falta un servicio, podés pedir que lo incorporemos.</p>
          </EmptyPanel>
        )}
      {result.data.slice(0, 20).map((r) => (
        <article className={styles.card} key={r.id}>
          <span className={styles.tag}>
            {
              {
                pending: "En revisión",
                accepted: "Resuelta",
                rejected: "No incorporada",
              }[r.status]
            }
          </span>
          <h2>{r.requested_name}</h2>
          <p className={styles.prose}>{r.reason}</p>
          {r.response && <p className={styles.notice}>{r.response}</p>}
          {r.status === "accepted" && r.service_id && (
            <Link
              className="text-link"
              href={`/busquedas?service=${encodeURIComponent(r.service_id)}`}
            >
              Buscar con esta opción
            </Link>
          )}
          {r.draft && (
            <>
              <p className={styles.meta}>
                Borrador privado guardado. No está publicado.
              </p>
              {r.status === "accepted" && r.service_id && (
                <Link
                  className="button button-secondary"
                  href={`/busquedas/nueva?tipo=${r.draft.kind === "offer" ? "offer" : "request"}&solicitud=${r.id}`}
                >
                  Retomar borrador
                </Link>
              )}
            </>
          )}
        </article>
      ))}
      <Pagination
        page={page}
        hasMore={result.data.length > 20}
        href="/catalogo/solicitudes"
      />
    </ExchangePage>
  );
}
