"use client";
import { useState } from "react";
import Link from "next/link";
import { CatalogCombobox } from "@/components/catalog-combobox";
import { searchServices, type Service } from "./model";

export function ServicePicker({
  services,
  value,
  onChange,
  label = "Servicio",
  name = "service",
  required = true,
  requestLink = true,
}: {
  services: Service[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  name?: string;
  required?: boolean;
  requestLink?: boolean;
}) {
  const selected = services.find((s) => s.id === value && s.selectable) ?? null;
  const [query, setQuery] = useState(selected?.name ?? "");
  return (
    <div>
      <CatalogCombobox
        label={label}
        name={name}
        required={required}
        options={searchServices(services, query)}
        query={query}
        onQueryChange={setQuery}
        value={selected}
        onSelect={(option) => onChange(option?.id ?? "")}
        placeholder="Por ejemplo, fono o neurología"
      />
      {requestLink && (
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
