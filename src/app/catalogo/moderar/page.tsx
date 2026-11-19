import { getExchangeContext } from "@/features/exchanges/repository";
import {
  ExchangePage,
  ExchangeNotice,
  EmptyPanel,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import {
  getCatalogRequests,
  getServiceCatalog,
} from "@/features/services/repository";
import { CatalogReviewForm } from "@/features/services/request-forms";
import { readPage } from "@/lib/pagination";
import { Pagination } from "@/components/pagination";
import styles from "@/features/exchanges/exchanges.module.css";
export const metadata = { ...privateMetadata, title: "Revisar catálogo" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const context = await getExchangeContext();
  if (!context.viewer?.moderator)
    return (
      <ExchangePage
        title="Revisión del catálogo"
        description="Este espacio requiere permisos de moderación."
      >
        <ParticipationNotice context={context} />
        {context.viewer && (
          <EmptyPanel title="No tenés permisos para revisar el catálogo" />
        )}
      </ExchangePage>
    );
  const page = readPage((await searchParams).pagina);
  const [result, catalog] = await Promise.all([
    getCatalogRequests({ queue: true, page }),
    getServiceCatalog(),
  ]);
  return (
    <ExchangePage
      title="Revisión del catálogo"
      description="Comprobá el nombre, los posibles duplicados y la fuente antes de incorporar una opción."
    >
      <ExchangeNotice status={result.status} />
      <ExchangeNotice status={catalog.status} />
      {result.status === "ready" && result.data.length === 0 && (
        <EmptyPanel title="No hay solicitudes pendientes" />
      )}
      {result.data.slice(0, 20).map((r) => (
        <article key={r.id} className={styles.card}>
          <h2>{r.requested_name}</h2>
          <p className={styles.prose}>{r.reason}</p>
          {r.source_url && (
            <a href={r.source_url} rel="noreferrer" target="_blank">
              Consultar fuente
            </a>
          )}
          {r.user_id === context.viewer!.id ? (
            <p>Otra persona debe revisar tu solicitud.</p>
          ) : (
            catalog.status === "ready" && (
              <CatalogReviewForm request={r} services={catalog.data} />
            )
          )}
        </article>
      ))}
      <Pagination
        page={page}
        hasMore={result.data.length > 20}
        href="/catalogo/moderar"
      />
    </ExchangePage>
  );
}
