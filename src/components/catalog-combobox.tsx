"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, Search, X } from "lucide-react";
import styles from "./catalog-combobox.module.css";

export type ComboOption = { id: string; name: string; approximate?: boolean };
const subscribe = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

/** Manual-selection combobox: displayed text never substitutes for a selected ID. */
export function CatalogCombobox({
  label,
  name,
  options,
  value,
  onSelect,
  query,
  onQueryChange,
  required = false,
  disabled = false,
  loading = false,
  error = "",
  placeholder = "Escribí para elegir…",
  emptyText = "No encontramos esa opción.",
  children,
}: {
  label: string;
  name: string;
  options: ComboOption[];
  value: ComboOption | null;
  onSelect: (option: ComboOption | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  placeholder?: string;
  emptyText?: string;
  children?: React.ReactNode;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    hydratedSnapshot,
    serverSnapshot,
  );
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const shown = options.slice(0, 8);
  const expanded = open && !disabled;
  const message = "Elegí una opción de la lista.";
  useEffect(() => {
    input.current?.setCustomValidity(
      !disabled && !value && (required || Boolean(query.trim())) ? message : "",
    );
  }, [value, required, query, disabled]);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setAnnouncement(
          expanded && !loading
            ? error ||
                `${options.length} opciones disponibles.${options.some((o) => o.approximate) ? " Incluye nombres parecidos." : ""}`
            : "",
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [expanded, loading, error, options]);
  function choose(option: ComboOption) {
    onSelect(option);
    onQueryChange(option.name);
    setOpen(false);
    setActive(-1);
    setInvalid(false);
    input.current?.setCustomValidity("");
    input.current?.focus();
  }
  return (
    <div
      className={styles.field}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.required}> (obligatorio)</span>}
      </label>
      <div className={styles.control}>
        <Search size={18} aria-hidden="true" />
        <input
          ref={input}
          id={id}
          name={`${name}-texto`}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={120}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            expanded && active >= 0 && shown[active]
              ? `${id}-option-${active}`
              : undefined
          }
          aria-invalid={invalid || undefined}
          aria-describedby={
            invalid ? `${id}-invalid` : error ? `${id}-error` : undefined
          }
          value={query}
          required={required}
          disabled={disabled || !hydrated}
          placeholder={placeholder}
          onInvalid={() => {
            setInvalid(true);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onSelect(null);
            setOpen(true);
            setActive(-1);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const next = !expanded
                ? 0
                : event.key === "ArrowDown"
                  ? Math.min(active + 1, shown.length - 1)
                  : Math.max(active - 1, 0);
              setActive(next);
              document
                .getElementById(`${id}-option-${next}`)
                ?.scrollIntoView({ block: "nearest" });
            } else if (
              event.key === "Enter" &&
              expanded &&
              active >= 0 &&
              shown[active]
            ) {
              event.preventDefault();
              choose(shown[active]);
            } else if (event.key === "Escape") {
              if (expanded) event.preventDefault();
              setOpen(false);
              setActive(-1);
            }
          }}
        />
        {value && (
          <Check size={18} className={styles.selected} aria-hidden="true" />
        )}
        {query && !disabled && (
          <button
            type="button"
            className={styles.clear}
            aria-label={`Limpiar ${label.toLocaleLowerCase("es-AR")}`}
            onClick={() => {
              onSelect(null);
              onQueryChange("");
              setOpen(true);
              setActive(-1);
              setInvalid(false);
              input.current?.focus();
            }}
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <input
        type="hidden"
        name={name}
        value={value?.id ?? ""}
        disabled={disabled}
      />
      {expanded && (
        <div className={styles.popup}>
          {loading && <p className={styles.note}>Cargando opciones…</p>}
          {error && (
            <p id={`${id}-error`} className={styles.error}>
              {error}
            </p>
          )}
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className={styles.list}
          >
            {!loading &&
              !error &&
              shown.map((option, index) => (
                <li
                  key={option.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={active === index}
                  className={active === index ? styles.active : undefined}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  {option.name}
                  {option.approximate && (
                    <span className={styles.note}>Nombre parecido</span>
                  )}
                </li>
              ))}
          </ul>
          {!loading && !error && shown.length === 0 && (
            <p className={styles.note}>{emptyText}</p>
          )}
          {!loading && options.length > 8 && (
            <p className={styles.note}>
              Escribí un poco más para acotar las opciones.
            </p>
          )}
        </div>
      )}
      {invalid && (
        <p id={`${id}-invalid`} className={styles.error}>
          {message}
        </p>
      )}
      {children}
      <noscript>
        Activá JavaScript para elegir una opción del catálogo.
      </noscript>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
