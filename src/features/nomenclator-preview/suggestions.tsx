"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/features/exchanges/model";
import { normalizeSearchText, searchBenefits } from "./catalog";
import styles from "./suggestions.module.css";

export function BenefitSuggestions({ query }: { query: string }) {
  const text = query.trim();
  const searching = text.length >= 2;
  const results = searching ? searchBenefits(text) : [];
  const services = searching
    ? SERVICES.filter((item) =>
        normalizeSearchText(item.name).includes(normalizeSearchText(text)),
      )
    : [];
  const [announcement, setAnnouncement] = useState("");
  const message = searching
    ? `${services.length ? `Servicios relacionados: ${services.map((item) => item.name).join(", ")}. ` : ""}${results.length} prestaciones relacionadas en la muestra. Las sugerencias aparecen debajo del campo.`
    : "";

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(message), 350);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className={styles.suggestions}>
      <p id="benefit-suggestions-hint" className={styles.hint}>
        <span className={styles.badge}>Prueba</span> Escribí para ver
        prestaciones relacionadas o explorá las categorías.
      </p>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {searching && (
        <div className={styles.matches}>
          {services.length > 0 && (
            <p className={styles.serviceHint}>
              Servicios relacionados:{" "}
              <strong>{services.map((item) => item.name).join(" · ")}</strong>
            </p>
          )}
          <p className={styles.title}>Prestaciones relacionadas con «{text}»</p>
          {results.length ? (
            <>
              <ul className={styles.list} role="list">
                {results.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.hint}>
                Son opciones del nomenclador para revisar, no profesionales
                disponibles
                {results.length > 3
                  ? `. Se muestran 3 de ${results.length}`
                  : ""}
                .
              </p>
            </>
          ) : (
            <p className={styles.hint}>
              No encontramos coincidencias en esta muestra. Probá otra palabra o
              explorá las categorías.
            </p>
          )}
        </div>
      )}
      <Link
        className={styles.link}
        href={
          text
            ? `/busquedas/prestaciones?${new URLSearchParams({ q: text })}`
            : "/busquedas/prestaciones"
        }
      >
        {searching && results.length
          ? "Ver estas prestaciones y sus categorías"
          : "Explorar prestaciones por categoría"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
