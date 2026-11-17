"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { PROVINCES } from "@/lib/geography";
import type { Place, Department } from "@/features/locations/model";
import { EXCHANGE_LIMITS } from "../model";
import styles from "../exchanges.module.css";

type LocationResult = { places: Place[]; departments: Department[] };
type Row = { key: number; place: Place | null };

function LocationRow({
  index,
  row,
  selectedIds,
  onChange,
  onRemove,
  focus,
  onFocused,
  allowEmpty,
  name,
  initialProvince,
}: {
  index: number;
  row: Row;
  selectedIds: string[];
  onChange: (place: Place | null) => void;
  onRemove?: () => void;
  focus: boolean;
  onFocused: () => void;
  allowEmpty: boolean;
  name: string;
  initialProvince?: string;
}) {
  const id = useId();
  const provinceRef = useRef<HTMLSelectElement>(null);
  const [province, setProvince] = useState(
    row.place?.province ?? initialProvince ?? "",
  );
  const [department, setDepartment] = useState(row.place?.departmentId ?? "");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LocationResult>({
    places: row.place ? [row.place] : [],
    departments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (focus) {
      provinceRef.current?.focus();
      onFocused();
    }
  }, [focus, onFocused]);
  useEffect(() => {
    if (!province) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ province, department, q: query });
      try {
        const response = await fetch(`/api/ubicaciones?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("locations");
        const data = (await response.json()) as LocationResult;
        if (!Array.isArray(data.places) || !Array.isArray(data.departments))
          throw new Error("locations");
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "No pudimos cargar las ubicaciones. Tu selección se conserva; volvé a intentar.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [province, department, query, retry]);
  const places =
    row.place && !result.places.some((place) => place.id === row.place?.id)
      ? [row.place, ...result.places]
      : result.places;
  const isCaba = province === "ciudad-autonoma-de-buenos-aires";
  return (
    <fieldset className={styles.location}>
      <legend>{allowEmpty ? "Ubicación" : `Ubicación ${index + 1}`}</legend>
      <div className={styles.field}>
        <label htmlFor={`${id}-province`}>
          Provincia o CABA{!allowEmpty && " (obligatorio)"}
        </label>
        <select
          ref={provinceRef}
          id={`${id}-province`}
          name={allowEmpty ? "province" : `${name}-province-${row.key}`}
          required={!allowEmpty}
          value={province}
          onChange={(event) => {
            setProvince(event.target.value);
            setDepartment("");
            setQuery("");
            setResult({ places: [], departments: [] });
            setError("");
            onChange(null);
          }}
        >
          <option value="">
            {allowEmpty ? "Todas las provincias" : "Elegí una provincia"}
          </option>
          {PROVINCES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {province && (
        <>
          {!isCaba && (
            <div className={styles.field}>
              <label htmlFor={`${id}-department`}>
                {province === "buenos-aires" ? "Partido" : "Departamento"}
              </label>
              <select
                id={`${id}-department`}
                name={`${name}-department-${row.key}`}
                value={department}
                onChange={(event) => {
                  setDepartment(event.target.value);
                  setQuery("");
                  setResult((current) => ({ ...current, places: [] }));
                  onChange(null);
                }}
              >
                <option value="">Todos; también podés buscar por nombre</option>
                {result.departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor={`${id}-query`}>
              Filtrar {isCaba ? "barrios" : "localidades"} por nombre
            </label>
            <input
              id={`${id}-query`}
              name={`${name}-query-${row.key}`}
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              maxLength={100}
              onChange={(event) => setQuery(event.target.value)}
              aria-describedby={`${id}-hint`}
            />
            <p id={`${id}-hint`} className={styles.meta}>
              Se muestran hasta 100 coincidencias. Escribí parte del nombre para
              acotar la lista.
            </p>
          </div>
          <div className={styles.field} aria-busy={loading}>
            <label htmlFor={`${id}-place`}>
              {isCaba ? "Barrio" : "Localidad"}
              {!allowEmpty && " (obligatorio)"}
            </label>
            <select
              id={`${id}-place`}
              name={name}
              value={row.place?.id ?? ""}
              required={!allowEmpty}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                const place =
                  places.find((item) => item.id === event.target.value) ?? null;
                if (
                  place &&
                  selectedIds.includes(place.id) &&
                  row.place?.id !== place.id
                ) {
                  event.currentTarget.setCustomValidity(
                    "Esta ubicación ya está agregada. Elegí otra.",
                  );
                  event.currentTarget.reportValidity();
                  return;
                }
                event.currentTarget.setCustomValidity("");
                onChange(place);
              }}
            >
              <option value="">
                {allowEmpty ? "Todas las localidades" : "Elegí una ubicación"}
              </option>
              {places.map((place) => (
                <option
                  key={place.id}
                  value={place.id}
                  disabled={
                    selectedIds.includes(place.id) && row.place?.id !== place.id
                  }
                >
                  {place.name}
                  {!isCaba && place.department ? ` — ${place.department}` : ""}
                </option>
              ))}
            </select>
          </div>
          {loading && <p className={styles.meta}>Cargando ubicaciones…</p>}
          {!loading && !error && places.length === 0 && (
            <p className={styles.meta}>
              No encontramos coincidencias. Probá con otro nombre o
              departamento.
            </p>
          )}
          {error && (
            <div id={`${id}-error`} className={styles.feedback} role="status">
              <p>{error}</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Reintentar ubicaciones
              </button>
            </div>
          )}
        </>
      )}
      {onRemove && (
        <div>
          <button
            className="button button-secondary"
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ubicación ${index + 1}${row.place ? `: ${row.place.name}` : ""}`}
          >
            <X size={16} aria-hidden="true" /> Quitar
          </button>
        </div>
      )}
    </fieldset>
  );
}

export function LocationPicker({
  initialPlaces = [],
  multiple = true,
  name = "locationIds",
  initialProvince,
}: {
  initialPlaces?: Place[];
  multiple?: boolean;
  name?: string;
  initialProvince?: string;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialPlaces.length
      ? initialPlaces.map((place, index) => ({ key: index, place }))
      : [{ key: 0, place: null }],
  );
  const nextKey = useRef(rows.length);
  const [focusKey, setFocusKey] = useState<number | null>(null);
  return (
    <div className={styles.stack}>
      {rows.map((row, index) => (
        <LocationRow
          key={row.key}
          index={index}
          row={row}
          name={name}
          initialProvince={initialProvince}
          allowEmpty={!multiple}
          focus={focusKey === row.key}
          onFocused={() => setFocusKey(null)}
          selectedIds={rows.flatMap((item) =>
            item.place ? [item.place.id] : [],
          )}
          onChange={(place) =>
            setRows((current) =>
              current.map((item) =>
                item.key === row.key ? { ...item, place } : item,
              ),
            )
          }
          onRemove={
            multiple && rows.length > 1
              ? () => {
                  setRows((current) =>
                    current.filter((item) => item.key !== row.key),
                  );
                  setFocusKey((rows[index + 1] ?? rows[index - 1]).key);
                }
              : undefined
          }
        />
      ))}
      {multiple && (
        <div className={styles.compact}>
          <div>
            <button
              type="button"
              className="button button-secondary"
              disabled={rows.length >= EXCHANGE_LIMITS.locations}
              onClick={() => {
                const key = nextKey.current++;
                setRows((current) => [...current, { key, place: null }]);
                setFocusKey(key);
              }}
            >
              <Plus size={18} aria-hidden="true" /> Agregar ubicación
            </button>
          </div>
          <p className={styles.meta}>
            Hasta {EXCHANGE_LIMITS.locations} ubicaciones. Tu publicación
            aparece una sola vez por búsqueda, aunque coincida en varias zonas.
          </p>
        </div>
      )}
    </div>
  );
}
