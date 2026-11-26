"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CatalogCombobox } from "@/components/catalog-combobox";
import { normalizeTerm, searchServices, type Service } from "./model";

export function ServicePicker({
  services,
  value,
  onChange,
  label = "Servicio",
  name = "service",
  required = true,
  disabled = false,
  requestLink = true,
  children,
}: {
  services: Service[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  requestLink?: boolean | "no-match";
  children?: ReactNode;
}) {
  const selected = services.find((s) => s.id === value && s.selectable) ?? null;
  const [query, setQuery] = useState(selected?.name ?? "");
  return (
    <div>
      <CatalogCombobox
        label={label}
        name={name}
        required={required}
        disabled={disabled}
        options={searchServices(services, query)}
        query={query}
        onQueryChange={setQuery}
        value={selected}
        onSelect={(option) => onChange(option?.id ?? "")}
        placeholder="Por ejemplo, fono o neurología"
        emptyText={
          requestLink === "no-match" && normalizeTerm(query) ? (
            <>
              No encontramos esa opción.{" "}
              <Link
                href="/catalogo/solicitar"
                className="text-link"
                prefetch={false}
              >
                Sugerir un servicio para el catálogo
              </Link>
            </>
          ) : undefined
        }
      >
        {children}
      </CatalogCombobox>
      {requestLink === true && (
        <Link
          href="/catalogo/solicitar"
          className="text-link"
          style={{
            display: "inline-block",
            marginTop: ".5rem",
            fontSize: ".85rem",
          }}
        >
          No encuentro lo que necesito
        </Link>
      )}
    </div>
  );
}
