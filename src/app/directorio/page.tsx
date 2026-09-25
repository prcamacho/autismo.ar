import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { ResourceSearch } from "@/components/resource-search";
import { categories } from "@/lib/catalog";
import { getProvinceName } from "@/lib/geography";
import { findResources } from "@/features/resources/repository";
import { ageGroups } from "@/features/resources/validation";
import { ResourceCard } from "@/features/resources/resource-card";
import {
  ConnectionNotice,
  Pagination,
  readPage,
} from "@/features/community/components";

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
  const query = firstValue(params.q, 160);
  const category = firstValue(params.categoria);
  const province = firstValue(params.provincia);
  const locality = firstValue(params.localidad, 120);
  const age = firstValue(params.edad);
  const page = readPage(params.pagina);
  const activeCategory = categories.find((item) => item.id === category);
  const provinceName = getProvinceName(province);
  const hasFilters = Boolean(query || category || province || locality || age);
  const invalidCategory = Boolean(category && !activeCategory);
  const invalidProvince = Boolean(province && !provinceName);
  const missingProvince = Boolean(locality && !province);
  const invalidFilters =
    invalidCategory ||
    invalidProvince ||
    missingProvince ||
    Boolean(age && !ageGroups.some((a) => a === age));
  const result = invalidFilters
    ? { data: [], status: "ready" as const }
    : await findResources({ query, category, province, locality, age, page });
  const results = result.data.slice(0, 20);
  const locationLabel = provinceName
    ? locality
      ? `${locality}, ${provinceName}`
      : provinceName
    : "todo el país";

  function categoryHref(nextCategory?: string, nextAge = age): string {
    const filters = new URLSearchParams();
    if (query) filters.set("q", query);
    if (nextCategory) filters.set("categoria", nextCategory);
    if (province) filters.set("provincia", province);
    if (locality) filters.set("localidad", locality);
    if (nextAge) filters.set("edad", nextAge);
    return filters.size ? `/directorio?${filters.toString()}` : "/directorio";
  }

  const contributionParams = new URLSearchParams();
  if (activeCategory) contributionParams.set("categoria", activeCategory.id);
  if (provinceName) contributionParams.set("provincia", province);
  if (locality && provinceName) contributionParams.set("localidad", locality);
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
      : "La búsqueda incluye una provincia o categoría que no reconocemos. Elegí una opción del formulario o limpiá los filtros para empezar de nuevo.";
  }

  return (
    <>
      <PageIntro
        eyebrow="Directorio"
        title="Encontrá recursos cerca tuyo"
        description="Un lugar para reunir la información que las familias necesitan. Buscá por tema y ubicación, con los recursos nacionales siempre a mano."
      />
      <section className="section-small container" aria-label="Buscar recursos">
        <ResourceSearch
          key={JSON.stringify({ query, category, province, locality, age })}
          defaults={{ query, category, province, locality, age }}
          compact
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
          hasMore={result.data.length > 20}
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
