import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import { getPlaces } from "@/features/locations/catalog";
import {
  getExchangeContext,
  searchListings,
} from "@/features/exchanges/repository";
import { EXCHANGE_LIMITS } from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  ListingCard,
  SignInNotice,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { SearchForm } from "@/features/services/search-form";
import { getServiceCatalog } from "@/features/services/repository";
import { getProvinceName } from "@/lib/geography";
import { findCatalogResources } from "@/features/resources/repository";
import { ResourceCard } from "@/features/resources/resource-card";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Búsquedas y disponibilidad",
};
const string = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

export default async function SearchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = params.tipo === "request" ? "request" : "offer";
  const service = string(params.service);
  const province = string(params.province);
  const place = string(params.place);
  const modality = ["presencial", "virtual", "mixta"].includes(
    string(params.modality),
  )
    ? string(params.modality)
    : "";
  const availability = ["available", "limited"].includes(
    string(params.availability),
  )
    ? string(params.availability)
    : "";
  const page = readPage(params.pagina);
  const [context, catalog] = await Promise.all([
    getExchangeContext(),
    getServiceCatalog(),
  ]);
  let validPlace = !place;
  try {
    validPlace = !place || getPlaces([place])[0]?.province === province;
  } catch {}
  const invalidFilters = Boolean(
    params.q ||
    (service && !catalog.data.some((s) => s.id === service)) ||
    (province && !getProvinceName(province)) ||
    !validPlace ||
    (string(params["service-texto"]) && !service) ||
    (string(params["place-texto"]) && !place),
  );
  const restricted = kind === "request" && !context.viewer;
  const result =
    restricted || invalidFilters
      ? { status: context.status, data: [] }
      : await searchListings({
          kind,
          service,
          province,
          place,
          modality,
          availability,
          page,
        });
  const resources =
    kind === "offer" && service && !invalidFilters
      ? await findCatalogResources({ service, province, place })
      : { status: "ready" as const, data: [] };
  let selectedPlaces: ReturnType<typeof getPlaces> = [];
  try {
    selectedPlaces = place ? getPlaces([place]) : [];
  } catch {
    /* An unknown URL filter never becomes a fabricated location. */
  }
  const href = `/busquedas?${new URLSearchParams({ tipo: kind, service, province, place, modality, availability })}`;
  return (
    <ExchangePage
      title={
        kind === "request"
          ? "Personas y familias que buscan apoyo"
          : "Encontrá profesionales y servicios"
      }
      description="Explorá disponibilidad profesional o publicá una búsqueda. Elegí las zonas que te sirven y conversá sin publicar tu teléfono."
      current="/busquedas"
    >
      <div className={styles.actions}>
        <Link href="/busquedas/nueva?tipo=request" className="button">
          Publicar una búsqueda
        </Link>
        <Link
          href="/busquedas/nueva?tipo=offer"
          className="button button-secondary"
        >
          Publicar disponibilidad
        </Link>
      </div>
      <div className={styles.card}>
        <SearchForm
          key={href}
          services={catalog.data}
          status={catalog.status}
          initialService={service}
          initialKind={kind}
          initialProvince={province}
          initialPlace={selectedPlaces[0] ?? null}
          required={false}
          advanced
          modality={modality}
          availability={availability}
        />
      </div>
      {invalidFilters && (
        <EmptyPanel title="Elegí opciones válidas del catálogo">
          <p>
            Seleccioná el servicio y la ubicación en el formulario para buscar.
          </p>
        </EmptyPanel>
      )}
      <ExchangeNotice status={result.status} />
      {restricted && context.status === "ready" ? (
        <SignInNotice />
      ) : !invalidFilters &&
        result.status === "ready" &&
        result.data.length === 0 ? (
        <EmptyPanel title="Todavía no hay publicaciones para esta búsqueda">
          <p>
            Probá con otra zona o servicio. También podés publicar una búsqueda
            o tu disponibilidad.
          </p>
        </EmptyPanel>
      ) : null}
      {kind === "offer" && service && (
        <section className={styles.stack}>
          <h2>Recursos del directorio</h2>
          <ExchangeNotice status={resources.status} />
          {resources.data.length > 0 ? (
            <>
              <div className={styles.cards}>
                {resources.data.slice(0, 3).map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
              <Link
                href={`/directorio?${new URLSearchParams({ service, province, place })}`}
              >
                Ver todas las fichas de este servicio
              </Link>
            </>
          ) : (
            resources.status === "ready" && (
              <p className={styles.meta}>
                Todavía no hay fichas clasificadas con este servicio en la zona
                elegida.
              </p>
            )
          )}
        </section>
      )}
      <div className={styles.cards}>
        {result.data.slice(0, EXCHANGE_LIMITS.pageSize).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <Pagination
        page={page}
        hasMore={result.data.length > EXCHANGE_LIMITS.pageSize}
        href={href}
      />
    </ExchangePage>
  );
}
