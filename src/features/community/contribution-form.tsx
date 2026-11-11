"use client";

import { useActionState, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import type { ResourceInput } from "@/features/resources/validation";
import { submitProposal } from "./actions";
import { type ActionResult } from "@/lib/result";
import styles from "@/components/ui.module.css";
import { ContributionFields } from "./contribution-fields";
import { DRAFT_MAX_BYTES, parseDraft, serializeDraft } from "./draft";

type Defaults = Partial<ResourceInput>;
export function ContributionForm({
  defaults = {},
  resourceId = "",
  version = 0,
  sourceUrl = "",
  canSubmit,
}: {
  defaults?: Defaults;
  resourceId?: string;
  version?: number;
  sourceUrl?: string;
  canSubmit: boolean;
}) {
  const [initial, setInitial] = useState({
    data: defaults,
    sourceUrl,
    note: "",
    key: 0,
  });
  const [scope, setScope] = useState(defaults.scope || "national");
  const [name, setName] = useState(defaults.name || "");
  const [localMessage, setLocalMessage] = useState("");
  const [state, dispatch, pending] = useActionState<ActionResult, FormData>(
    submitProposal,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  function download() {
    if (!formRef.current) return;
    try {
      const contents = serializeDraft(new FormData(formRef.current));
      const url = URL.createObjectURL(
        new Blob([contents], { type: "application/json;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "autismo-ar-aporte.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setLocalMessage(
        "Borrador descargado en tu dispositivo. No fue enviado ni publicado. Podés volver a cargarlo desde este formulario.",
      );
    } catch (error) {
      setLocalMessage(
        error instanceof Error
          ? error.message
          : "No pudimos preparar el borrador.",
      );
    }
  }
  async function importDraft(file?: File) {
    if (!file) return;
    if (file.size > DRAFT_MAX_BYTES) {
      setLocalMessage("El archivo es demasiado grande para ser un borrador.");
      return;
    }
    try {
      const draft = parseDraft(await file.text(), resourceId, version);
      setInitial((previous) => ({
        data: draft.resource,
        sourceUrl: draft.sourceUrl,
        note: draft.note,
        key: previous.key + 1,
      }));
      setScope(draft.resource.scope);
      setName(draft.resource.name);
      setLocalMessage(
        "Borrador cargado. Revisá los datos y confirmá el permiso para compartirlos.",
      );
    } catch (error) {
      setLocalMessage(
        error instanceof Error
          ? error.message
          : "No pudimos leer este borrador.",
      );
    }
  }
  if (state.ok && state.id)
    return (
      <div className={`${styles.card} ${styles.stack}`} role="status">
        <span className={styles.status}>En moderación</span>
        <h2>Gracias por sumar información</h2>
        <p>{state.message}</p>
        <Link className="button" href={`/comunidad/aportes/${state.id}`}>
          Seguir mi aporte
        </Link>
        <Link href="/comunidad" className="text-link">
          Volver a la comunidad
        </Link>
      </div>
    );
  return (
    <form
      ref={formRef}
      className={`${styles.card} ${styles.form}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) {
          download();
          return;
        }
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      <div className={styles.topline}>
        <h2>{resourceId ? "Proponer una corrección" : "Sumar un recurso"}</h2>
        <span className={styles.status}>
          {canSubmit ? "Revisión antes de publicar" : "Borrador local"}
        </span>
      </div>
      <p className={styles.meta}>
        Los campos con * son obligatorios. Dejá vacíos los datos que no conocés.
      </p>
      <fieldset disabled={pending} key={initial.key} className={styles.stack}>
        <input type="hidden" name="resourceId" value={resourceId} />
        <input type="hidden" name="baseVersion" value={version} />
        <ContributionFields
          defaults={initial.data}
          resourceId={resourceId}
          name={name}
          onNameChange={setName}
          scope={scope}
          onScopeChange={setScope}
          sourceUrl={initial.sourceUrl}
          note={initial.note}
        />
        <div className={styles.actions}>
          <button className="button" type="submit">
            {pending
              ? "Enviando…"
              : canSubmit
                ? "Enviar a revisión"
                : "Descargar borrador"}
          </button>
          {canSubmit && (
            <button
              className="button button-secondary"
              type="button"
              onClick={download}
            >
              <Download size={17} aria-hidden="true" /> Descargar borrador
            </button>
          )}
        </div>
        <details className={styles.details}>
          <summary>
            <Upload size={16} aria-hidden="true" /> Cargar un borrador anterior
          </summary>
          <div className="form-field">
            <label htmlFor="draft-file">Archivo del borrador (.json)</label>
            <input
              type="file"
              id="draft-file"
              accept="application/json,.json"
              onChange={(e) => void importDraft(e.target.files?.[0])}
            />
          </div>
        </details>
      </fieldset>
      <div aria-live="polite">
        {state.message && <p className={styles.feedback}>{state.message}</p>}
        {localMessage && <p className={styles.feedback}>{localMessage}</p>}
      </div>
      <noscript>
        Este formulario necesita JavaScript para preparar un borrador o enviar
        un aporte.
      </noscript>
    </form>
  );
}
