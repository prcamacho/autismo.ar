"use client";

import { useRef, useState } from "react";
import styles from "./articles.module.css";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  hint?: string;
  rows?: number;
  type?: "text" | "url" | "date";
  bold?: boolean;
  invalid?: boolean;
};

export function EditorTextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  hint,
  rows,
  type = "text",
  bold = false,
  invalid,
}: TextFieldProps) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [boldMessage, setBoldMessage] = useState("");
  const description =
    [hint ? `${id}-hint` : "", boldMessage ? `${id}-bold` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const common = {
    id,
    name: id,
    value,
    maxLength,
    "aria-describedby": description,
    "aria-invalid": invalid || undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChange(event.target.value);
      setBoldMessage("");
    },
  };

  function markBold() {
    const field = textarea.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    if (start === end) {
      setBoldMessage("Primero seleccioná el texto que querés destacar.");
      field.focus();
      return;
    }
    if (maxLength && value.length + 4 > maxLength) {
      setBoldMessage(
        "No hay espacio para agregar el destacado. Acortá un poco el texto.",
      );
      return;
    }
    onChange(
      `${value.slice(0, start)}**${value.slice(start, end)}**${value.slice(end)}`,
    );
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + 2, end + 2);
    });
    setBoldMessage("");
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {rows ? (
        <textarea {...common} ref={textarea} rows={rows} />
      ) : (
        <input
          {...common}
          type={type}
          {...(type === "url"
            ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false }
            : {})}
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {bold && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.smallButton}
            onClick={markBold}
          >
            <strong>Negrita</strong> en la selección
          </button>
          <span className={styles.hint}>
            También podés escribir **texto destacado**.
          </span>
        </div>
      )}
      {boldMessage && (
        <p id={`${id}-bold`} className={styles.hint} role="status">
          {boldMessage}
        </p>
      )}
    </div>
  );
}

export function focusEditorItem(id: string) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id);
    const control =
      element?.querySelector<HTMLElement>(
        "textarea:not(:disabled), input:not(:disabled), select:not(:disabled)",
      ) || element?.querySelector<HTMLElement>("button:not(:disabled)");
    (control || element)?.focus();
  });
}
