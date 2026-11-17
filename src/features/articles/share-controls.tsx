"use client";

import { useId, useRef, useState } from "react";
import { articleShareText } from "./content";
import styles from "./articles.module.css";

export function ShareControls({
  title,
  summary,
  url,
}: {
  title: string;
  summary: string;
  url: string;
}) {
  const [message, setMessage] = useState("");
  const [manualText, setManualText] = useState("");
  const fieldId = useId();
  const field = useRef<HTMLTextAreaElement>(null);

  async function copy(text: string) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(text);
      setManualText("");
      setMessage("Copiado. Ya podés pegarlo donde quieras compartirlo.");
    } catch {
      setManualText(text);
      setMessage(
        "No pudimos copiar automáticamente. Seleccioná el texto de abajo y usá Copiar.",
      );
      requestAnimationFrame(() => {
        field.current?.focus();
        field.current?.select();
      });
    }
  }

  return (
    <section className={styles.share} aria-label="Compartir artículo">
      <div className={styles.toolbar}>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => copy(url)}
        >
          Copiar enlace
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => copy(articleShareText(title, summary, url))}
        >
          Copiar resumen y enlace
        </button>
      </div>
      <p role="status">{message}</p>
      {manualText && (
        <div className={styles.field}>
          <label htmlFor={fieldId}>Texto para copiar</label>
          <textarea
            id={fieldId}
            ref={field}
            readOnly
            value={manualText}
            rows={5}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
      <noscript>
        <p>
          Podés compartir este artículo copiando la dirección de la barra del
          navegador.
        </p>
      </noscript>
    </section>
  );
}
