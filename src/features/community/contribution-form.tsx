"use client";

import { useActionState, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";
import {
  ageGroups,
  proposalFromForm,
  proposalInputSchema,
  type ResourceInput,
} from "@/features/resources/validation";
import { submitProposal } from "./actions";
import type { ActionResult } from "./model";
import styles from "./community.module.css";
import { DuplicateFinder } from "./duplicate-finder";

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
    const parsed = proposalInputSchema.safeParse(
      proposalFromForm(new FormData(formRef.current)),
    );
    if (!parsed.success) {
      setLocalMessage(
        parsed.error.issues[0]?.message || "Completá los campos obligatorios.",
      );
      return;
    }
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { format: "autismo.ar/proposal-v1", ...parsed.data },
            null,
            2,
          ),
        ],
        { type: "application/json;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "autismo-ar-aporte.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLocalMessage(
      "Borrador descargado en tu dispositivo. No fue enviado ni publicado. Podés volver a cargarlo desde este formulario.",
    );
  }
  async function importDraft(file?: File) {
    if (!file) return;
    if (file.size > 30000) {
      setLocalMessage("El archivo es demasiado grande para ser un borrador.");
      return;
    }
    try {
      const raw = JSON.parse(await file.text());
      const parsed = proposalInputSchema.safeParse(raw);
      if (raw.format !== "autismo.ar/proposal-v1" || !parsed.success)
        throw new Error("invalid");
      if (
        parsed.data.resourceId !== resourceId ||
        parsed.data.baseVersion !== version
      ) {
        setLocalMessage(
          "Este borrador pertenece a otra ficha o versión. Abrí la ficha correspondiente; si cambió, prepará una corrección sobre la versión actual.",
        );
        return;
      }
      setInitial({
        data: parsed.data.resource,
        sourceUrl: parsed.data.sourceUrl,
        note: parsed.data.note,
        key: initial.key + 1,
      });
      setScope(parsed.data.resource.scope);
      setName(parsed.data.resource.name);
      setLocalMessage(
        "Borrador cargado. Revisá los datos y confirmá el permiso para compartirlos.",
      );
    } catch {
      setLocalMessage(
        "No pudimos leer este borrador. Usá un archivo descargado desde este formulario.",
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
        <div className="form-field">
          <label htmlFor="name">Nombre del recurso *</label>
          <input
            id="name"
            name="name"
            minLength={3}
            maxLength={160}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del lugar, profesional o servicio"
          />
        </div>
        {!resourceId && <DuplicateFinder name={name} />}
        <fieldset>
          <legend>¿Qué tipo de recurso es? *</legend>
          <div className={styles.choices}>
            {categories.map((c) => (
              <label className={styles.choice} key={c.id}>
                <input
                  name="categoryIds"
                  type="checkbox"
                  value={c.id}
                  defaultChecked={initial.data.categoryIds?.includes(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-field">
          <label htmlFor="description">Qué ofrece *</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            minLength={30}
            maxLength={2000}
            required
            defaultValue={initial.data.description}
            placeholder="Servicios y modalidades que se pueden comprobar en una fuente. Evitá valoraciones personales."
          />
        </div>
        <fieldset className={styles.section}>
          <legend>Ubicación y alcance</legend>
          <div className="form-field">
            <label htmlFor="scope">¿A quiénes alcanza? *</label>
            <select
              id="scope"
              name="scope"
              value={scope}
              onChange={(e) =>
                setScope(e.target.value as ResourceInput["scope"])
              }
            >
              <option value="national">Todo el país</option>
              <option value="province">Una provincia</option>
              <option value="local">Una localidad</option>
            </select>
          </div>
          {scope !== "national" && (
            <div className="form-field">
              <label htmlFor="province">Provincia *</label>
              <select
                id="province"
                name="province"
                required
                defaultValue={initial.data.province || ""}
              >
                <option value="">Elegí una provincia</option>
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {scope === "local" && (
            <div className="form-field">
              <label htmlFor="locality">Localidad *</label>
              <input
                id="locality"
                name="locality"
                required
                minLength={2}
                maxLength={120}
                defaultValue={initial.data.locality}
              />
              <p className={styles.meta}>
                Compartí la localidad del recurso. No incluyas domicilios
                familiares.
              </p>
            </div>
          )}
        </fieldset>
        <fieldset className={styles.section}>
          <legend>Datos que ayudan a decidir</legend>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="website-resource">Sitio o perfil público</label>
              <input
                id="website-resource"
                name="website"
                type="url"
                maxLength={1000}
                defaultValue={initial.data.website}
                placeholder="https://"
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Teléfono público del recurso</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={80}
                defaultValue={initial.data.phone}
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="hours">Horarios o modalidad de atención</label>
            <input
              id="hours"
              name="hours"
              maxLength={300}
              defaultValue={initial.data.hours}
            />
          </div>
          <div className="form-field">
            <label htmlFor="coverage">
              Obras sociales o cobertura informada
            </label>
            <input
              id="coverage"
              name="coverage"
              maxLength={400}
              defaultValue={initial.data.coverage}
            />
            <p className={styles.meta}>
              Incluí solo lo que la fuente informa. La cobertura y los turnos
              pueden cambiar.
            </p>
          </div>
          <fieldset>
            <legend>Edades atendidas, si están informadas</legend>
            <div className={styles.choices}>
              {ageGroups.map((age) => (
                <label key={age} className={styles.choice}>
                  <input
                    name="ageGroups"
                    type="checkbox"
                    value={age}
                    defaultChecked={initial.data.ageGroups?.includes(age)}
                  />
                  {age}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
        <fieldset className={styles.section}>
          <legend>Fuente y contexto</legend>
          <div className="form-field">
            <label htmlFor="sourceUrl">Enlace a la fuente *</label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              maxLength={1000}
              required
              defaultValue={initial.sourceUrl}
              placeholder="https://"
            />
            <p className={styles.meta}>
              Página oficial, publicación del recurso u otra fuente pública que
              permita revisar el dato.
            </p>
          </div>
          <div className="form-field">
            <label htmlFor="note">
              Qué comprobaste o qué querés corregir *
            </label>
            <textarea
              id="note"
              name="note"
              minLength={10}
              maxLength={1000}
              rows={3}
              required
              defaultValue={initial.note}
            />
            <p className={styles.meta}>
              Si tenés relación con el recurso, aclaralo acá. Este contexto
              acompaña la revisión; no es una reseña.
            </p>
          </div>
          <label className={styles.choice}>
            <input name="consent" type="checkbox" required />
            Confirmo que puedo compartir esta información pública del recurso.
            No incluye datos de menores, historias clínicas ni contactos
            privados.
          </label>
        </fieldset>
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
