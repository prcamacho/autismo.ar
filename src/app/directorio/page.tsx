import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { SearchForm } from "@/features/services/search-form";
import { getServiceCatalog } from "@/features/services/repository";
import { getPlaces } from "@/features/locations/catalog";
import { categories } from "@/lib/catalog";
import { getProvinceName } from "@/lib/geography";
import { findCatalogResources } from "@/features/resources/repository";
import { ageGroups } from "@/features/resources/validation";
import { ResourceCard } from "@/features/resources/resource-card";
import { ConnectionNotice } from "@/components/connection-notice";
import { Pagination } from "@/components/pagination";
import { readPage, PAGE_SIZE } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Directorio de recursos",
  description:
    "Buscá profesionales, centros, educación, transporte y redes de apoyo por provincia y localidad.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(
  value: string | string[] | undefined,
  maxLength = 100,
): string {
  return ((Array.isArray(value) ? value[0] : value)?.trim() ?? "").slice(
    0,
    maxLength,
  );
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const catalog = await getServiceCatalog();
  const service = firstValue(params.service, 60);
  const query = catalog.data.find((s) => s.id === service)?.name ?? "";
  const place = firstValue(params.place, 80);
  let selectedPlace = null;
  try {
    selectedPlace = place ? getPlaces([place])[0] : null;
  } catch {}
  const category = firstValue(params.categoria);
  const province = firstValue(params.province ?? params.provincia);
  const locality = selectedPlace?.name ?? "";
  const age = firstValue(params.edad);
  const page = readPage(params.pagina);
  const activeCategory = categories.find((item) => item.id === category);
  const provinceName = getProvinceName(province);
  const hasFilters = Boolean(query || category || province || locality || age);
  const invalidCategory = Boolean(category && !activeCategory);
  const invalidProvince = Boolean(province && !provinceName);
  const missingProvince = Boolean(locality && !province);
  const invalidFilters =
    Boolean(
      (service && !query) ||
      (place && selectedPlace?.province !== province) ||
      params.q ||
      params.localidad ||
      (!service && firstValue(params["service-texto"])) ||
      (!place && firstValue(params["place-texto"])),
    ) ||
    invalidCategory ||
    invalidProvince ||
    missingProvince ||
    Boolean(age && !ageGroups.some((a) => a === age));
  const result = invalidFilters
    ? { data: [], status: "ready" as const }
    : await findCatalogResources({
        service,
        category,
        province,
        place,
        age,
        page,
      });
  const results = result.data.slice(0, PAGE_SIZE);
  const locationLabel = provinceName
    ? locality
      ? `${locality}, ${provinceName}`
      : provinceName
    : "todo el país";

  function categoryHref(nextCategory?: string, nextAge = age): string {
    const filters = new URLSearchParams();
    if (service) filters.set("service", service);
    if (nextCategory) filters.set("categoria", nextCategory);
    if (province) filters.set("province", province);
    if (place) filters.set("place", place);
    if (nextAge) filters.set("edad", nextAge);
    return filters.size ? `/directorio?${filters.toString()}` : "/directorio";
  }

  const contributionParams = new URLSearchParams();
  if (activeCategory) contributionParams.set("categoria", activeCategory.id);
  if (provinceName) contributionParams.set("provincia", province);
  if (place && provinceName) contributionParams.set("place", place);
  if (service) contributionParams.set("service", service);
  const contributionHref = contributionParams.size
    ? `/aportar?${contributionParams.toString()}`
    : "/aportar";

  let emptyTitle = "Este directorio empieza con la comunidad";
  let emptyDescription =
    "Todavía no hay fichas publicadas. Si conocés un profesional, un centro o una red de apoyo, podés preparar un aporte con su fuente.";

  if (hasFilters) {
    emptyTitle = `Todavía no tenemos resultados para ${locationLabel}`;
    emptyDescription =
      "No hay fichas publicadas que coincidan con esta búsqueda. Podés cambiar los filtros o preparar un aporte para sumar un recurso.";
  }
  if (invalidFilters) {
    emptyTitle = "Revisá los filtros de tu búsqueda";
    emptyDescription = missingProvince
      ? "Para buscar una localidad, elegí primero su provincia. Así evitamos confundir lugares con el mismo nombre."
      : "La búsqueda incluye texto sin seleccionar o una opción que no reconocemos. Elegí una opción del formulario o limpiá los filtros para empezar de nuevo.";
  }

  return (
    <>
      <PageIntro
        eyebrow="Búsquedas"
        title="Directorio de recursos"
        description="Consultá fichas de profesionales, centros y redes de apoyo. Para encontrar cupos o pedidos de apoyo, elegí Avisos."
      />
      <section className="section-small container" aria-label="Buscar recursos">
        <SearchForm
          key={JSON.stringify({ service, province, place, category, age })}
          services={catalog.data}
          status={catalog.status}
          initialService={service}
          initialProvince={province}
          initialPlace={selectedPlace}
          view="directory"
          category={category}
          age={age}
          required={false}
        />
        <nav className="chips" aria-label="Filtrar por categoría">
          <Link
            href={categoryHref()}
            className={`chip${!category ? " is-active" : ""}`}
            aria-current={!category ? "page" : undefined}
          >
            Todas las categorías
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={categoryHref(item.id)}
              className={`chip${category === item.id ? " is-active" : ""}`}
              aria-current={category === item.id ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <nav className="chips" aria-label="Filtrar por edades atendidas">
          <Link
            href={categoryHref(category, "")}
            className={`chip${!age ? " is-active" : ""}`}
            aria-current={!age ? "page" : undefined}
          >
            Todas las edades
          </Link>
          {ageGroups.map((item) => (
            <Link
              key={item}
              href={categoryHref(category, item)}
              className={`chip${age === item ? " is-active" : ""}`}
              aria-current={age === item ? "page" : undefined}
            >
              {item}
            </Link>
          ))}
        </nav>
        <ConnectionNotice status={result.status} />

        <div className="results-header">
          <div>
            <h2>
              {result.status === "unavailable"
                ? "Búsqueda no disponible"
                : results.length
                  ? `${results.length} recursos en esta página`
                  : "Recursos de la comunidad"}
            </h2>
            <p>
              {invalidFilters ? (
                "Hay filtros que necesitan revisión."
              ) : (
                <>
                  {activeCategory?.name ?? "Todas las categorías"} ·{" "}
                  {locationLabel}
                  {query ? ` · “${query}”` : ""}
                </>
              )}
            </p>
          </div>
          {hasFilters && (
            <Link href="/directorio" className="text-link">
              Limpiar filtros
            </Link>
          )}
        </div>

        {result.status === "unavailable" ? (
          <Link href={categoryHref(category)} className="text-link">
            Volver a intentar
          </Link>
        ) : results.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            href={contributionHref}
            action="Sumar un recurso"
          />
        ) : (
          <div className="content-grid">
            {results.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
        <Pagination
          page={page}
          hasMore={result.data.length > PAGE_SIZE}
          href={categoryHref(category)}
        />

        <div className="notice">
          <Info size={19} aria-hidden="true" />
          <p>
            Estamos empezando. Los resultados mostrarán los recursos registrados
            en autismo.ar, no un listado completo de los servicios de cada
            lugar. Al elegir una localidad, también se incluirá la información
            nacional y provincial que pueda servirte.
          </p>
        </div>
      </section>
    </>
  );
}
