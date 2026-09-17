import type { Metadata } from "next";
import Link from "next/link";
import { Info, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { ResourceSearch } from "@/components/resource-search";
import { categories, searchResources } from "@/lib/catalog";
import { getProvinceName } from "@/lib/geography";

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
  const activeCategory = categories.find((item) => item.id === category);
  const provinceName = getProvinceName(province);
  const hasFilters = Boolean(query || category || province || locality);
  const invalidCategory = Boolean(category && !activeCategory);
  const invalidProvince = Boolean(province && !provinceName);
  const missingProvince = Boolean(locality && !province);
  const invalidFilters = invalidCategory || invalidProvince || missingProvince;
  const results = invalidFilters
    ? []
    : await searchResources({ query, category, province, locality });
  const locationLabel = provinceName
    ? locality
      ? `${locality}, ${provinceName}`
      : provinceName
    : "todo el país";

  function categoryHref(nextCategory?: string): string {
    const filters = new URLSearchParams();
    if (query) filters.set("q", query);
    if (nextCategory) filters.set("categoria", nextCategory);
    if (province) filters.set("provincia", province);
    if (locality) filters.set("localidad", locality);
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
    "Todavía no hay fichas cargadas. Si conocés un profesional, un centro o una red de apoyo, tu información puede ayudar a otra familia. Estamos preparando el sistema para recibir esos aportes.";

  if (hasFilters) {
    emptyTitle = `Todavía no tenemos resultados para ${locationLabel}`;
    emptyDescription =
      "No hay fichas que coincidan con esta búsqueda. Podés cambiar los filtros o conocer qué información necesitaremos para sumar un recurso.";
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
          key={JSON.stringify({ query, category, province, locality })}
          defaults={{ query, category, province, locality }}
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

        <div className="results-header">
          <div>
            <h2>{results.length} recursos encontrados</h2>
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

        {results.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            href={contributionHref}
            action="Cómo sumar un recurso"
          />
        ) : (
          <div className="content-grid">
            {results.map((resource) => (
              <article className="panel" key={resource.id}>
                <span className="badge">
                  {resource.scope === "national"
                    ? "Alcance nacional"
                    : resource.scope === "province"
                      ? "Alcance provincial"
                      : "Recurso local"}
                </span>
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <p>
                  <MapPin size={16} aria-hidden="true" />{" "}
                  {resource.scope === "national"
                    ? "Todo el país"
                    : [
                        resource.locality,
                        ...resource.provinceIds.map(getProvinceName),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </p>
              </article>
            ))}
          </div>
        )}

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
