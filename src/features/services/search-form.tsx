"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Megaphone, Search } from "lucide-react";
import { PROVINCES } from "@/lib/geography";
import { CatalogCombobox } from "@/components/catalog-combobox";
import type { Place } from "@/features/locations/model";
import type { Service } from "./model";
import { ServicePicker } from "./service-picker";
import { useHomeSearchLocation } from "./home-search-location";
import styles from "./search-form.module.css";

type SearchView = "directory" | "listings";

function SearchViews({
  view,
  service,
  province,
  place,
}: {
  view: SearchView;
  service: string;
  province: string;
  place: Place | null;
}) {
  const query: Record<string, string> = {};
  if (service) query.service = service;
  if (province) query.province = province;
  if (province && place?.province === province) query.place = place.id;

  return (
    <nav className={styles.views} aria-label="Vistas de Búsquedas">
      {(
        [
          ["directory", "/directorio", "Directorio de recursos", BookOpen],
          ["listings", "/busquedas", "Avisos", Megaphone],
        ] as const
      ).map(([key, pathname, label, Icon]) => {
        const content = (
          <>
            <Icon size={18} aria-hidden="true" />
            {label}
          </>
        );
        return view === key ? (
          <span key={key} aria-current="page">
            {content}
          </span>
        ) : (
          <Link key={key} href={{ pathname, query }} prefetch={false}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export function PlacePicker({
  province,
  onProvinceChange,
  initialPlace = null,
  onPlaceChange,
  placeName = "place",
  required = false,
}: {
  province: string;
  onProvinceChange: (province: string) => void;
  initialPlace?: Place | null;
  onPlaceChange?: (place: Place | null) => void;
  placeName?: string;
  required?: boolean;
}) {
  const id = useId();
  const [selected, setSelected] = useState<Place | null>(initialPlace);
  const [query, setQuery] = useState(initialPlace?.name ?? "");
  const [places, setPlaces] = useState<Place[]>(
    initialPlace ? [initialPlace] : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!province) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/ubicaciones?${new URLSearchParams({ province, q: query.replace(/·/g, " ") })}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("locations");
        const result = await response.json();
        if (!Array.isArray(result.places)) throw new Error("locations");
        if (!controller.signal.aborted) setPlaces(result.places);
      } catch {
        if (!controller.signal.aborted)
          setError("No pudimos cargar las localidades.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [province, query, retry]);
  return (
    <>
      <div className={styles.field}>
        <label htmlFor={`${id}-province`}>
          Provincia{required ? " (obligatorio)" : ""}
        </label>
        <select
          id={`${id}-province`}
          name="province"
          value={province}
          required={required}
          onChange={(event) => {
            onProvinceChange(event.target.value);
            setSelected(null);
            setQuery("");
            setPlaces([]);
            setError("");
            onPlaceChange?.(null);
          }}
        >
          <option value="">
            {required ? "Elegí una provincia" : "Todo el país"}
          </option>
          {PROVINCES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <CatalogCombobox
          label={
            province === "ciudad-autonoma-de-buenos-aires"
              ? "Barrio"
              : "Localidad"
          }
          name={placeName}
          value={selected}
          query={query}
          onQueryChange={setQuery}
          options={places.map((p) => ({
            ...p,
            name:
              p.kind === "neighborhood"
                ? p.name
                : `${p.name} · ${p.department}`,
          }))}
          onSelect={(option) => {
            const place = places.find((p) => p.id === option?.id) ?? null;
            setSelected(place);
            onPlaceChange?.(place);
          }}
          disabled={!province}
          required={required}
          loading={loading}
          error={error}
          placeholder={province ? "Elegí una localidad" : "Elegí una provincia"}
          emptyText="Probá con otro nombre de localidad o partido."
        />
        {error && (
          <button
            type="button"
            className="text-link"
            onClick={() => setRetry((x) => x + 1)}
          >
            Reintentar localidades
          </button>
        )}
      </div>
    </>
  );
}

export function SearchForm({
  services,
  status = "ready",
  initialService = "",
  initialKind = "offer",
  initialProvince = "",
  initialPlace = null,
  view,
  category = "",
  age = "",
  required = true,
  modality = "",
  availability = "",
}: {
  services: Service[];
  status?: string;
  initialService?: string;
  initialKind?: "offer" | "request";
  initialProvince?: string;
  initialPlace?: Place | null;
  view?: SearchView;
  category?: string;
  age?: string;
  required?: boolean;
  modality?: string;
  availability?: string;
}) {
  const id = useId();
  const [kind, setKind] = useState(initialKind);
  const [service, setService] = useState(initialService);
  const homeLocation = useHomeSearchLocation();
  const router = useRouter();
  const homeCatalogUnavailable = homeLocation !== null && status !== "ready";
  const [filterProvince, setFilterProvince] = useState(initialProvince);
  const [place, setPlace] = useState(initialPlace);
  const province = homeLocation?.province ?? filterProvince;
  const directory = view === "directory";
  return (
    <>
      {view && (
        <SearchViews
          view={view}
          service={service}
          province={province}
          place={place}
        />
      )}
      <search>
        <form
          action={directory ? "/directorio" : "/busquedas"}
          method="get"
          className={styles.form}
          aria-label={directory ? "Buscar en el directorio" : "Buscar avisos"}
        >
          {!directory && (
            <fieldset className={styles.modes}>
              <legend className="sr-only">Qué querés encontrar</legend>
              {[
                [
                  "offer",
                  view === "listings"
                    ? "Disponibilidad profesional"
                    : "Busco apoyo",
                ],
                [
                  "request",
                  view === "listings"
                    ? "Solicitudes de apoyo"
                    : "Soy profesional",
                ],
              ].map(([value, label]) => (
                <div key={value}>
                  <input
                    id={`${id}-${value}`}
                    type="radio"
                    name="tipo"
                    value={value}
                    checked={kind === value}
                    onChange={() => setKind(value as "offer" | "request")}
                  />
                  <label htmlFor={`${id}-${value}`}>{label}</label>
                </div>
              ))}
            </fieldset>
          )}
          <div className={styles.grid}>
            <ServicePicker
              services={services}
              value={service}
              onChange={setService}
              label={
                kind === "request"
                  ? "¿De qué especialidad buscás solicitudes?"
                  : "¿Qué servicio necesitás?"
              }
              required={required}
              disabled={homeCatalogUnavailable}
              requestLink={homeLocation ? "no-match" : true}
            >
              {homeLocation &&
                (kind === "offer" ? (
                  <a
                    className={`text-link ${styles.browseLink}`}
                    href="#explorar"
                  >
                    Explorar el directorio por categoría
                  </a>
                ) : (
                  <Link
                    className={`text-link ${styles.browseLink}`}
                    href={{
                      pathname: "/busquedas",
                      query: { tipo: "request", ...homeLocation.query },
                    }}
                    prefetch={false}
                  >
                    Ver solicitudes de apoyo
                  </Link>
                ))}
            </ServicePicker>
            <PlacePicker
              province={province}
              onProvinceChange={homeLocation?.setProvince ?? setFilterProvince}
              onPlaceChange={homeLocation?.setPlace ?? setPlace}
              initialPlace={initialPlace}
            />
            <button
              type="submit"
              className={`button ${styles.submit}`}
              disabled={homeCatalogUnavailable}
            >
              <Search size={18} aria-hidden="true" /> Buscar
            </button>
          </div>
          {status !== "ready" && (
            <p className={styles.error} role="status">
              No pudimos cargar el catálogo.{" "}
              {homeLocation ? (
                <button
                  type="button"
                  className={styles.retry}
                  onClick={() => router.refresh()}
                >
                  Volver a intentar
                </button>
              ) : (
                <Link href={directory ? "/directorio" : "/busquedas"}>
                  Volver a intentar
                </Link>
              )}
            </p>
          )}
          {directory && (
            <>
              <input type="hidden" name="categoria" value={category} />
              <input type="hidden" name="edad" value={age} />
            </>
          )}
          {view === "listings" && (
            <details className={styles.advanced}>
              <summary>Más filtros</summary>
              <div className={styles.filters}>
                <div className={styles.field}>
                  <label htmlFor={`${id}-modality`}>Modalidad</label>
                  <select
                    id={`${id}-modality`}
                    name="modality"
                    defaultValue={modality}
                  >
                    <option value="">Todas</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                    <option value="mixta">Presencial y virtual</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor={`${id}-availability`}>
                    {kind === "request"
                      ? "Estado de la necesidad"
                      : "Disponibilidad"}
                  </label>
                  <select
                    id={`${id}-availability`}
                    name="availability"
                    defaultValue={availability}
                  >
                    <option value="">Cualquiera</option>
                    <option value="available">Disponible</option>
                    <option value="limited">Limitada</option>
                  </select>
                </div>
              </div>
            </details>
          )}
        </form>
      </search>
    </>
  );
}
