"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";

const subscribe = () => () => {};

export function ContributionForm({
  initialCategory = "",
  initialProvince = "",
  initialLocality = "",
}: {
  initialCategory?: string;
  initialProvince?: string;
  initialLocality?: string;
}) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [scope, setScope] = useState(initialProvince ? "local" : "national");
  const [province, setProvince] = useState(initialProvince);
  const [locality, setLocality] = useState(
    initialProvince ? initialLocality : "",
  );
  const [downloaded, setDownloaded] = useState(false);
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      format: "autismo.ar/contribution-draft-v1",
      status: "local-draft-not-submitted",
      name: String(form.get("name") ?? "").trim(),
      category: form.get("category"),
      scope,
      province: scope === "national" ? null : province,
      locality: scope === "local" ? locality.trim() : null,
      description: String(form.get("description") ?? "").trim(),
      sourceUrl: String(form.get("sourceUrl") ?? "").trim(),
    };
    const draftText = JSON.stringify(data, null, 2);
    setDraft(draftText);
    const url = URL.createObjectURL(
      new Blob([draftText], { type: "application/json;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "autismo-ar-borrador.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  return (
    <form
      className="contribution-form panel"
      onSubmit={handleSubmit}
      onChange={() => setDownloaded(false)}
    >
      <noscript>
        <p className="notice">
          Activá JavaScript para preparar un borrador en tu dispositivo. Este
          formulario no envía información al servidor.
        </p>
      </noscript>
      <fieldset disabled={!ready}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">TU PRIMER APORTE</p>
            <h2>Prepará la información</h2>
          </div>
          <span className="badge">Borrador local</span>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="name">
              Nombre del recurso <span>*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={160}
              placeholder="Nombre del lugar, profesional o material"
            />
          </div>
          <div className="form-field">
            <label htmlFor="category">
              Categoría <span>*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={initialCategory}
            >
              <option value="" disabled>
                Elegí una categoría
              </option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="biblioteca">Apps y materiales</option>
            </select>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="scope">¿A quién le puede servir?</label>
          <select
            id="scope"
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="national">A personas de todo el país</option>
            <option value="province">A personas de una provincia</option>
            <option value="local">A personas de una localidad</option>
          </select>
        </div>
        {scope !== "national" && (
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="province">
                Provincia <span>*</span>
              </label>
              <select
                id="province"
                name="province"
                required
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value);
                  setLocality("");
                }}
              >
                <option value="" disabled>
                  Elegí una provincia
                </option>
                {PROVINCES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {scope === "local" && (
              <div className="form-field">
                <label htmlFor="locality">
                  Localidad <span>*</span>
                </label>
                <input
                  id="locality"
                  name="locality"
                  required
                  maxLength={120}
                  value={locality}
                  onChange={(event) => setLocality(event.target.value)}
                  autoComplete="address-level2"
                />
              </div>
            )}
          </div>
        )}
        <div className="form-field">
          <label htmlFor="description">
            ¿Qué información querés compartir? <span>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={15}
            maxLength={2500}
            rows={5}
            placeholder="Contá qué ofrece y qué datos conocés. Si algo no está confirmado, aclaralo."
            aria-describedby="description-help"
          />
          <small id="description-help">
            Compartí solo información pública. Evitá datos personales de
            familias, menores o documentación médica.
          </small>
        </div>
        <div className="form-field">
          <label htmlFor="sourceUrl">
            Fuente o enlace original <span>(opcional)</span>
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            placeholder="https://…"
            maxLength={1000}
          />
          <small>
            Puede ser la web del lugar, la página del autor o una fuente
            oficial.
          </small>
        </div>
        <div className="form-actions">
          <button type="submit" className="button">
            <Download size={18} /> Descargar borrador
          </button>
          <p>
            Se descarga un archivo en tu dispositivo.
            <br />
            Todavía no se envía ni se publica en el sitio.
          </p>
        </div>
        {downloaded && (
          <>
            <p role="status" className="success-message">
              <FileCheck2 size={19} /> Tu borrador está listo para guardar. No
              fue enviado ni publicado.
            </p>
            <details className="draft-preview">
              <summary>Ver o copiar el contenido del borrador</summary>
              <p>
                Si tu navegador no inicia la descarga, podés copiar este
                contenido y guardarlo.
              </p>
              <label className="sr-only" htmlFor="draft-preview">
                Contenido del borrador
              </label>
              <textarea id="draft-preview" readOnly value={draft} rows={12} />
            </details>
          </>
        )}
      </fieldset>
    </form>
  );
}
