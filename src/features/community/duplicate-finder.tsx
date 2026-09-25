"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { findPossibleDuplicates } from "./actions";
import { getProvinceName } from "@/lib/geography";
import styles from "./community.module.css";
export function DuplicateFinder({ name }: { name: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof findPossibleDuplicates>
  > | null>(null);
  const [searched, setSearched] = useState("");
  return (
    <div className={styles.callout}>
      <strong>Primero, veamos si ya tiene una ficha</strong>
      <p>
        Un recurso puede tener varias categorías. Si ya existe, proponé una
        corrección desde su ficha.
      </p>
      <button
        type="button"
        className="button button-secondary"
        disabled={pending || name.trim().length < 3}
        onClick={() =>
          start(async () => {
            const response = await findPossibleDuplicates(name);
            setResult(response);
            setSearched(name);
          })
        }
      >
        {pending ? "Buscando…" : "Comprobar coincidencias"}
      </button>
      <div aria-live="polite">
        {result && searched === name && (
          <>
            {result.status !== "ready" ? (
              <p>La búsqueda comunitaria todavía no está disponible.</p>
            ) : result.data.length ? (
              <ul>
                {result.data.map((r) => (
                  <li key={r.slug}>
                    <Link className="text-link" href={`/directorio/${r.slug}`}>
                      {r.name} ·{" "}
                      {[r.locality, getProvinceName(r.province)]
                        .filter(Boolean)
                        .join(", ") || "Todo el país"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No encontramos coincidencias con ese nombre. Probá también
                variantes antes de crear una ficha.
              </p>
            )}
          </>
        )}
      </div>
      <Link
        href={`/directorio?q=${encodeURIComponent(name.trim())}`}
        target="_blank"
        className="text-link"
      >
        Explorar el directorio ↗<span className="sr-only"> (otra pestaña)</span>
      </Link>
    </div>
  );
}
