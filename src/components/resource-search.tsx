"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { PROVINCES } from "@/lib/geography";
import { BenefitSuggestions } from "@/features/nomenclator-preview/suggestions";
import previewStyles from "@/features/nomenclator-preview/suggestions.module.css";

type Defaults = {
  query?: string;
  category?: string;
  province?: string;
  locality?: string;
  age?: string;
};

export function ResourceSearch({
  defaults = {},
  compact = false,
  nomenclatorPreview = false,
}: {
  defaults?: Defaults;
  compact?: boolean;
  nomenclatorPreview?: boolean;
}) {
  const [query, setQuery] = useState(defaults.query ?? "");
  const [province, setProvince] = useState(defaults.province ?? "");
  const [locality, setLocality] = useState(defaults.locality ?? "");

  return (
    <form
      action="/directorio"
      method="get"
      className={`resource-search ${compact ? "search-compact" : ""} ${nomenclatorPreview ? previewStyles.search : ""}`}
    >
      {defaults.category && (
        <input type="hidden" name="categoria" value={defaults.category} />
      )}
      {defaults.age && <input type="hidden" name="edad" value={defaults.age} />}
      <div className="search-field search-query">
        <label htmlFor="resource-query">¿Qué recurso necesitás?</label>
        <div className="input-wrap">
          <Search size={19} aria-hidden="true" />
          <input
            id="resource-query"
            name="q"
            type="search"
            placeholder="Un profesional, una escuela, un apoyo…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-describedby={
              nomenclatorPreview ? "benefit-suggestions-hint" : undefined
            }
            maxLength={160}
          />
        </div>
        {nomenclatorPreview && <BenefitSuggestions query={query} />}
      </div>
      <div className="search-field">
        <label htmlFor="resource-province">Provincia</label>
        <div className="input-wrap">
          <MapPin size={18} aria-hidden="true" />
          <select
            id="resource-province"
            name="provincia"
            value={province}
            onChange={(event) => {
              setProvince(event.target.value);
              setLocality("");
            }}
          >
            <option value="">Todo el país</option>
            {PROVINCES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="search-field">
        <label htmlFor="resource-locality">
          Localidad <span>(opcional)</span>
        </label>
        <div className="input-wrap">
          <input
            id="resource-locality"
            name="localidad"
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            placeholder={
              province ? "Escribí tu localidad" : "Elegí una provincia"
            }
            disabled={!province}
            maxLength={120}
            autoComplete="address-level2"
          />
        </div>
      </div>
      <button className="button search-submit" type="submit">
        <Search size={18} aria-hidden="true" />
        Buscar
      </button>
    </form>
  );
}
