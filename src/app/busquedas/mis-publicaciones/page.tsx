import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import {
  getExchangeContext,
  getOwnListings,
} from "@/features/exchanges/repository";
import { EXCHANGE_LIMITS } from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  ListingCard,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { EnrollmentForm } from "@/features/exchanges/components/profile-form";
import { DeleteExchangeAccountForm } from "@/features/exchanges/components/contact-forms";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Mis búsquedas y disponibilidad",
};
export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const page = readPage((await searchParams).pagina);
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getOwnListings(page),
  ]);
  return (
    <ExchangePage
      title="Mis búsquedas y disponibilidad"
      description="Seguí las revisiones, actualizá las zonas y cerrá las publicaciones cuando ya no las necesites."
      current="/busquedas/mis-publicaciones"
    >
      <ParticipationNotice context={context} />
      {context.viewer && (
        <>
          <div className={styles.actions}>
            <Link href="/busquedas/nueva?tipo=request" className="button">
              Publicar una búsqueda
            </Link>
            <Link href="/busquedas/reportes" className="text-link">
              Mis reportes y resoluciones
            </Link>
            <Link
              href="/busquedas/nueva?tipo=offer"
              className="button button-secondary"
            >
              Publicar disponibilidad
            </Link>
            {context.viewer.moderator && (
              <Link href="/busquedas/moderar" className="text-link">
                Moderar publicaciones
              </Link>
            )}
          </div>
          <ExchangeNotice status={result.status} />
          {result.status === "ready" && result.data.length === 0 && (
            <EmptyPanel
              title={
                page === 1
                  ? "Todavía no tenés publicaciones"
                  : "No hay más publicaciones en esta página"
              }
            >
              <p>
                Podés publicar una búsqueda de apoyo o tu disponibilidad
                profesional.
              </p>
            </EmptyPanel>
          )}
          <div className={styles.cards}>
            {result.data.slice(0, EXCHANGE_LIMITS.pageSize).map((listing) => (
              <ListingCard key={listing.id} listing={listing} manage />
            ))}
          </div>
          <Pagination
            page={page}
            hasMore={result.data.length > EXCHANGE_LIMITS.pageSize}
            href="/busquedas/mis-publicaciones"
          />
          {context.account && (
            <div key={context.viewer.id} className={styles.narrow}>
              <div className={styles.card}>
                <EnrollmentForm
                  enrolled
                  notifications={context.account.notifications}
                  notificationsAvailable={context.notificationsAvailable}
                />
                <DeleteExchangeAccountForm />
              </div>
            </div>
          )}
        </>
      )}
    </ExchangePage>
  );
}
