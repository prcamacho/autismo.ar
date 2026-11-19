import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { getPlaces } from "@/features/locations/catalog";
import {
  getExchangeContext,
  getListing,
} from "@/features/exchanges/repository";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  Status,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ListingForm } from "@/features/exchanges/components/listing-form";
import { ListingStateForm } from "@/features/exchanges/components/management-forms";
import styles from "@/features/exchanges/exchanges.module.css";
import { getServiceCatalog } from "@/features/services/repository";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Administrar publicación",
};
export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, result, catalog] = await Promise.all([
    getExchangeContext(),
    getListing(id),
    getServiceCatalog(),
  ]);
  const listing = result.data;
  return (
    <ExchangePage
      title="Administrar publicación."
      description="Actualizá tu disponibilidad y ubicaciones, o cerrá la publicación cuando ya no la necesites."
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <ExchangeNotice status={result.status} />
          <ExchangeNotice status={catalog.status} />
          {listing?.owner ? (
            <>
              <div className={styles.card}>
                <Status value={listing.status} />
                {listing.review_note && (
                  <p className={styles.prose}>{listing.review_note}</p>
                )}
                <Link href={`/busquedas/${id}`} className="text-link">
                  Ver publicación →
                </Link>
              </div>
              <div className={styles.card}>
                <ListingForm
                  key={listing.id}
                  kind={listing.kind}
                  listing={listing}
                  services={catalog.data}
                  nonce={randomUUID()}
                  initialPlaces={getPlaces(listing.data.locationIds)}
                  disabled={
                    context.status !== "ready" ||
                    catalog.status !== "ready" ||
                    !context.account
                  }
                />
              </div>
              <div className={styles.card}>
                <h2>Vigencia</h2>
                <p className={styles.meta}>
                  Renovar confirma que los datos siguen vigentes. Cerrar indica
                  que la búsqueda o disponibilidad terminó.
                </p>
                {["published", "paused"].includes(listing.status) && (
                  <ListingStateForm id={id} state="renew" />
                )}
                {listing.status === "published" && (
                  <ListingStateForm id={id} state="paused" />
                )}
                {listing.status !== "closed" && (
                  <ListingStateForm id={id} state="closed" />
                )}
                <details className={styles.disclosure}>
                  <summary>Eliminar esta publicación</summary>
                  <ListingStateForm id={id} state="delete" />
                </details>
              </div>
            </>
          ) : (
            result.status === "ready" && (
              <EmptyPanel title="No podés editar esta publicación">
                <p>Ingresá con la cuenta que la creó.</p>
                <Link href="/cuenta" className="text-link">
                  Ir a mi cuenta →
                </Link>
              </EmptyPanel>
            )
          )}
        </div>
      </div>
    </ExchangePage>
  );
}
