"use client";

import Link from "next/link";
import { useId } from "react";
import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";
import {
  AGENDA_KINDS,
  ARTICLE_HEADING_STYLES,
  ARTICLE_LIMITS as L,
  ARTICLE_THEMES,
  type ArticleInput,
  type AgendaRow,
  type ArticleSource,
} from "./model";
import { EditorTextField, focusEditorItem } from "./editor-fields";
import styles from "./articles.module.css";

type ArticleFieldsProps = {
  value: ArticleInput;
  onChange: (value: ArticleInput) => void;
};

export function ArticleDetails({ value, onChange }: ArticleFieldsProps) {
  const prefix = useId();
  const change = <K extends keyof ArticleInput>(
    key: K,
    next: ArticleInput[K],
  ) => onChange({ ...value, [key]: next });
  return (
    <fieldset className={styles.section}>
      <legend>Información del artículo</legend>
      <EditorTextField
        id={`${prefix}-title`}
        label="Título"
        value={value.title}
        maxLength={L.title}
        hint="Para publicar, escribí al menos 5 caracteres. El borrador puede quedar incompleto."
        onChange={(v) => change("title", v)}
      />
      <fieldset className={styles.fieldset}>
        <legend>Formato</legend>
        <div className={styles.choices}>
          {[
            ["article", "Artículo"],
            ["agenda", "Agenda con fechas"],
          ].map(([key, label]) => (
            <div className={styles.choice} key={key}>
              <input
                id={`${prefix}-kind-${key}`}
                name={`${prefix}-kind`}
                type="radio"
                checked={value.kind === key}
                onChange={() => change("kind", key as ArticleInput["kind"])}
              />
              <label htmlFor={`${prefix}-kind-${key}`}>{label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor={`${prefix}-category`}>Categoría (opcional)</label>
        <select
          id={`${prefix}-category`}
          name={`${prefix}-category`}
          value={value.category}
          onChange={(event) => change("category", event.target.value)}
        >
          <option value="">Información general</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${prefix}-province`}>Provincia (opcional)</label>
        <select
          id={`${prefix}-province`}
          name={`${prefix}-province`}
          value={value.province}
          onChange={(event) =>
            onChange({
              ...value,
              province: event.target.value,
              locality: event.target.value ? value.locality : "",
            })
          }
        >
          <option value="">Sin ubicación específica</option>
          {PROVINCES.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>
      {value.province && (
        <EditorTextField
          id={`${prefix}-locality`}
          label="Localidad o zona (opcional)"
          value={value.locality}
          maxLength={L.locality}
          hint="Indicá dónde aplica la información. No escribas domicilios particulares."
          onChange={(v) => change("locality", v)}
        />
      )}
      <EditorTextField
        id={`${prefix}-expiration`}
        label="Información vigente hasta (opcional)"
        type="date"
        value={value.expiresOn}
        hint="Después de esa fecha se mostrará un aviso de información vencida."
        onChange={(v) => change("expiresOn", v)}
      />
    </fieldset>
  );
}

export function AgendaEditor({
  rows,
  onChange,
}: {
  rows: AgendaRow[];
  onChange: (rows: AgendaRow[]) => void;
}) {
  const prefix = useId();
  function change(index: number, patch: Partial<AgendaRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  return (
    <fieldset className={styles.section}>
      <legend>Fechas de la agenda</legend>
      <p className={styles.hint}>
        Diferenciá una fecha para solicitar un turno de una fecha de atención.
        Para publicar una agenda hace falta al menos una fecha y una fuente.
      </p>
      {rows.map((row, index) => (
        <fieldset
          key={index}
          className={styles.block}
          id={`${prefix}-${index}`}
        >
          <legend>Fecha {index + 1}</legend>
          <EditorTextField
            id={`${prefix}-${index}-date`}
            label="Fecha"
            type="date"
            value={row.date}
            onChange={(date) => change(index, { date })}
          />
          <EditorTextField
            id={`${prefix}-${index}-title`}
            label="Especialidad o actividad"
            value={row.title}
            maxLength={L.agendaTitle}
            onChange={(title) => change(index, { title })}
          />
          <fieldset className={styles.fieldset}>
            <legend>Qué ocurre ese día</legend>
            <div className={styles.choices}>
              {Object.entries(AGENDA_KINDS).map(([kind, label]) => (
                <div key={kind} className={styles.choice}>
                  <input
                    type="radio"
                    name={`${prefix}-${index}-kind`}
                    id={`${prefix}-${index}-${kind}`}
                    checked={row.kind === kind}
                    onChange={() =>
                      change(index, { kind: kind as AgendaRow["kind"] })
                    }
                  />
                  <label htmlFor={`${prefix}-${index}-${kind}`}>{label}</label>
                </div>
              ))}
            </div>
          </fieldset>
          <EditorTextField
            id={`${prefix}-${index}-details`}
            label="Aclaración (opcional)"
            rows={3}
            value={row.details}
            maxLength={L.agendaDetails}
            onChange={(details) => change(index, { details })}
          />
          <div>
            <button
              type="button"
              className={styles.smallButton}
              onClick={() => {
                onChange(rows.filter((_, i) => i !== index));
                focusEditorItem(`${prefix}-add`);
              }}
            >
              Quitar fecha {index + 1}
            </button>
          </div>
        </fieldset>
      ))}
      <div id={`${prefix}-add`}>
        <button
          type="button"
          className="button button-secondary"
          disabled={rows.length >= L.agendaRows}
          onClick={() => {
            onChange([
              ...rows,
              { date: "", title: "", details: "", kind: "request" },
            ]);
            focusEditorItem(`${prefix}-${rows.length}`);
          }}
        >
          ＋ Agregar fecha
        </button>
      </div>
      <p className={styles.hint}>
        {rows.length} de {L.agendaRows} fechas
      </p>
    </fieldset>
  );
}

export function SourcesEditor({
  sources,
  onChange,
}: {
  sources: ArticleSource[];
  onChange: (sources: ArticleSource[]) => void;
}) {
  const prefix = useId();
  function change(index: number, patch: Partial<ArticleSource>) {
    onChange(
      sources.map((source, i) =>
        i === index ? { ...source, ...patch } : source,
      ),
    );
  }
  return (
    <fieldset className={styles.section}>
      <legend>Fuentes</legend>
      <p className={styles.hint}>
        Enlazá la publicación original u otra fuente que permita comprobar los
        datos. Usá material propio o autorizado.
      </p>
      {sources.map((source, index) => (
        <fieldset
          key={index}
          className={styles.block}
          id={`${prefix}-${index}`}
        >
          <legend>Fuente {index + 1}</legend>
          <EditorTextField
            id={`${prefix}-${index}-label`}
            label="Nombre de la fuente"
            value={source.label}
            maxLength={L.linkLabel}
            onChange={(label) => change(index, { label })}
          />
          <EditorTextField
            id={`${prefix}-${index}-url`}
            label="Enlace a la fuente"
            type="url"
            value={source.url}
            maxLength={L.url}
            onChange={(url) => change(index, { url })}
          />
          <div>
            <button
              type="button"
              className={styles.smallButton}
              onClick={() => {
                onChange(sources.filter((_, i) => i !== index));
                focusEditorItem(`${prefix}-add`);
              }}
            >
              Quitar fuente {index + 1}
            </button>
          </div>
        </fieldset>
      ))}
      <div id={`${prefix}-add`}>
        <button
          type="button"
          className="button button-secondary"
          disabled={sources.length >= L.sources}
          onClick={() => {
            onChange([...sources, { label: "", url: "" }]);
            focusEditorItem(`${prefix}-${sources.length}`);
          }}
        >
          ＋ Agregar fuente
        </button>
      </div>
    </fieldset>
  );
}

export function ArticleAppearance({
  value,
  onChange,
  cafecitoAvailable,
}: ArticleFieldsProps & { cafecitoAvailable: boolean }) {
  const prefix = useId();
  return (
    <fieldset className={styles.section}>
      <legend>Presentación y apoyo</legend>
      <fieldset className={styles.fieldset}>
        <legend>Color de los detalles</legend>
        <div className={styles.choices}>
          {Object.entries(ARTICLE_THEMES).map(([theme, label]) => (
            <div className={styles.choice} data-accent={theme} key={theme}>
              <input
                type="radio"
                name={`${prefix}-theme`}
                id={`${prefix}-${theme}`}
                checked={value.theme === theme}
                onChange={() =>
                  onChange({ ...value, theme: theme as ArticleInput["theme"] })
                }
              />
              <label htmlFor={`${prefix}-${theme}`}>{label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend>Estilo de los subtítulos</legend>
        <div className={styles.choices}>
          {Object.entries(ARTICLE_HEADING_STYLES).map(([style, label]) => (
            <div className={styles.choice} key={style}>
              <input
                type="radio"
                name={`${prefix}-heading`}
                id={`${prefix}-${style}`}
                checked={value.headingStyle === style}
                onChange={() =>
                  onChange({
                    ...value,
                    headingStyle: style as ArticleInput["headingStyle"],
                  })
                }
              />
              <label htmlFor={`${prefix}-${style}`}>{label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <div className={styles.choice}>
        <input
          type="checkbox"
          id={`${prefix}-cafecito`}
          name={`${prefix}-cafecito`}
          checked={value.showCafecito}
          aria-describedby={`${prefix}-cafecito-help`}
          onChange={(event) =>
            onChange({ ...value, showCafecito: event.target.checked })
          }
        />
        <label htmlFor={`${prefix}-cafecito`}>
          Mostrar mi botón de Cafecito en este artículo
        </label>
      </div>
      <p id={`${prefix}-cafecito-help`} className={styles.hint}>
        {cafecitoAvailable
          ? "Se usará el botón aprobado de tu perfil. El aporte se realiza en Cafecito."
          : "El botón aparecerá cuando configures Cafecito en tu perfil y se revise su destino."}{" "}
        <Link className={styles.external} href="/cuenta/perfil-autor">
          Configurar mi Cafecito
        </Link>
      </p>
    </fieldset>
  );
}
