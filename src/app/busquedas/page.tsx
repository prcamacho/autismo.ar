import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import { getPlaces } from "@/features/locations/catalog";
import {
  getExchangeContext,
  searchListings,
} from "@/features/exchanges/repository";
import {
  AVAILABILITY,
  EXCHANGE_LIMITS,
  MODALITIES,
  SERVICES,
} from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  ListingCard,
  SignInNotice,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { LocationPicker } from "@/features/exchanges/components/location-picker";
import { RadioChoices } from "@/features/exchanges/components/fields";
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
  const context = await getExchangeContext();
  const restricted = kind === "request" && !context.viewer;
  const result = restricted
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
  let selectedPlaces: ReturnType<typeof getPlaces> = [];
  try {
    selectedPlaces = place ? getPlaces([place]) : [];
  } catch {
    /* An unknown URL filter never becomes a fabricated location. */
  }
  const href = `/busquedas?${new URLSearchParams({ tipo: kind, service, province, place, modality, availability })}`;
  return (
    <ExchangePage
      title="Encontrarse para dar el próximo paso."
      description="Explorá disponibilidad profesional o publicá una búsqueda. Elegí las zonas que te sirven y conversá sin publicar tu teléfono."
      current="/busquedas"
    >
      <div className={styles.actions}>
        <Link href="/busquedas/nueva?tipo=request" className="button">
          Busco un profesional
        </Link>
        <Link
          href="/busquedas/nueva?tipo=offer"
          className="button button-secondary"
        >
          Ofrezco mis servicios
        </Link>
      </div>
      <nav className={styles.nav} aria-label="Tipo de publicaciones">
        <Link
          href="/busquedas?tipo=offer"
          aria-current={kind === "offer" ? "page" : undefined}
        >
          Profesionales disponibles
        </Link>
        <Link
          href="/busquedas?tipo=request"
          aria-current={kind === "request" ? "page" : undefined}
        >
          Personas y familias que buscan
        </Link>
      </nav>
      <search className={styles.card}>
        <form
          action="/busquedas"
          method="get"
          className={styles.form}
          aria-label="Filtrar publicaciones"
        >
          <input type="hidden" name="tipo" value={kind} />
          <div className={styles.field}>
            <label htmlFor="search-service">Servicio</label>
            <select
              key={service}
              id="search-service"
              name="service"
              defaultValue={service}
            >
              <option value="">Todos los servicios</option>
              {SERVICES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <LocationPicker
            key={`${province}:${place}`}
            initialPlaces={selectedPlaces}
            initialProvince={province}
            multiple={false}
            name="place"
          />
          <RadioChoices
            key={`modality:${modality}`}
            name="modality"
            legend="Modalidad"
            options={{ "": "Todas", ...MODALITIES }}
            value={modality}
          />
          <RadioChoices
            key={`availability:${availability}`}
            name="availability"
            legend="Disponibilidad"
            options={{
              "": "Cualquier disponibilidad",
              available: AVAILABILITY.available,
              limited: AVAILABILITY.limited,
            }}
            value={availability}
          />
          <div className={styles.actions}>
            <button type="submit" className="button">
              Buscar publicaciones
            </button>
            <Link href={`/busquedas?tipo=${kind}`} className="text-link">
              Limpiar filtros
            </Link>
          </div>
        </form>
      </search>
      <ExchangeNotice status={result.status} />
      {restricted && context.status === "ready" ? (
        <SignInNotice />
      ) : result.status === "ready" && result.data.length === 0 ? (
        <EmptyPanel title="Todavía no hay publicaciones para esta búsqueda">
          <p>
            Probá con otra zona o servicio. También podés publicar una búsqueda
            o tu disponibilidad.
          </p>
        </EmptyPanel>
      ) : null}
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
