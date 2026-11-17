"use client";

import { useId, useState } from "react";
import { ARTICLE_LIMITS as L, type ArticleBlock } from "./model";
import { EditorTextField, focusEditorItem } from "./editor-fields";
import { TableEditor } from "./table-editor";
import styles from "./articles.module.css";

const labels: Record<ArticleBlock["type"], string> = {
  paragraph: "Texto",
  heading: "Subtítulo",
  callout: "Recuadro destacado",
  list: "Lista",
  link: "Enlace",
  table: "Tabla",
};

function emptyBlock(type: ArticleBlock["type"]): ArticleBlock {
  switch (type) {
    case "paragraph":
    case "heading":
    case "callout":
      return { type, text: "" };
    case "list":
      return { type, items: [""] };
    case "link":
      return { type, label: "", url: "" };
    case "table":
      return { type, headers: ["", ""], rows: [["", ""]] };
  }
}

function BlockFields({
  id,
  block,
  onChange,
}: {
  id: string;
  block: ArticleBlock;
  onChange: (block: ArticleBlock) => void;
}) {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "callout":
      return (
        <EditorTextField
          id={`${id}-text`}
          label={labels[block.type]}
          value={block.text}
          maxLength={L.text}
          rows={block.type === "heading" ? 2 : 5}
          bold
          onChange={(text) => onChange({ ...block, text })}
        />
      );
    case "list":
      return (
        <EditorTextField
          id={`${id}-items`}
          label="Elementos de la lista"
          value={block.items.join("\n")}
          rows={5}
          maxLength={L.listItems * (L.listItem + 1)}
          hint={`Un elemento por línea. Hasta ${L.listItems} elementos de ${L.listItem} caracteres cada uno.`}
          onChange={(text) => onChange({ ...block, items: text.split("\n") })}
        />
      );
    case "link":
      return (
        <>
          <EditorTextField
            id={`${id}-label`}
            label="Texto del enlace"
            value={block.label}
            maxLength={L.linkLabel}
            onChange={(label) => onChange({ ...block, label })}
          />
          <EditorTextField
            id={`${id}-url`}
            label="Dirección del enlace"
            type="url"
            value={block.url}
            maxLength={L.url}
            hint="Usá una dirección completa que comience con https:// o http://."
            onChange={(url) => onChange({ ...block, url })}
          />
        </>
      );
    case "table":
      return <TableEditor id={id} value={block} onChange={onChange} />;
  }
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}) {
  const prefix = useId();
  const [type, setType] = useState<ArticleBlock["type"]>("paragraph");
  const [removed, setRemoved] = useState<{
    block: ArticleBlock;
    index: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function move(index: number, offset: number) {
    const target = index + offset;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setAnnouncement(`Bloque movido a la posición ${target + 1}.`);
    focusEditorItem(`${prefix}-${target}`);
  }
  function remove(index: number) {
    setRemoved({ block: blocks[index], index });
    onChange(blocks.filter((_, i) => i !== index));
    setAnnouncement("Bloque quitado. Podés deshacer esta acción.");
    focusEditorItem(`${prefix}-controls`);
  }
  function add() {
    onChange([...blocks, emptyBlock(type)]);
    setAnnouncement(`${labels[type]} agregado.`);
    focusEditorItem(`${prefix}-${blocks.length}`);
  }

  return (
    <fieldset className={styles.section}>
      <legend>Contenido</legend>
      <p className={styles.hint}>
        Agregá los bloques que necesites. Podés cambiar su orden y previsualizar
        el resultado antes de guardar.
      </p>
      <div className={styles.blocks}>
        {blocks.map((block, index) => (
          <div key={index} className={styles.block} id={`${prefix}-${index}`}>
            <div className={styles.blockTop}>
              <h3>
                {index + 1}. {labels[block.type]}
              </h3>
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className={styles.smallButton}
                  aria-label={`Subir bloque ${index + 1}`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑ Subir
                </button>
                <button
                  type="button"
                  className={styles.smallButton}
                  aria-label={`Bajar bloque ${index + 1}`}
                  disabled={index === blocks.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓ Bajar
                </button>
                <button
                  type="button"
                  className={styles.smallButton}
                  aria-label={`Quitar bloque ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  Quitar
                </button>
              </div>
            </div>
            <BlockFields
              id={`${prefix}-${index}`}
              block={block}
              onChange={(value) =>
                onChange(blocks.map((b, i) => (i === index ? value : b)))
              }
            />
          </div>
        ))}
      </div>
      <div id={`${prefix}-controls`} className={styles.field}>
        <label htmlFor={`${prefix}-type`}>Tipo de bloque</label>
        <select
          id={`${prefix}-type`}
          name={`${prefix}-type`}
          value={type}
          onChange={(event) =>
            setType(event.target.value as ArticleBlock["type"])
          }
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className={styles.toolbar}>
          <button
            type="button"
            className="button button-secondary"
            disabled={blocks.length >= L.blocks}
            onClick={add}
          >
            ＋ Agregar bloque
          </button>
          {removed && (
            <button
              type="button"
              className={styles.smallButton}
              disabled={blocks.length >= L.blocks}
              onClick={() => {
                const next = [...blocks];
                next.splice(
                  Math.min(removed.index, blocks.length),
                  0,
                  removed.block,
                );
                onChange(next);
                setRemoved(null);
                setAnnouncement("Se recuperó el bloque quitado.");
              }}
            >
              Deshacer último bloque quitado
            </button>
          )}
        </div>
        <p className={styles.hint}>
          {blocks.length} de {L.blocks} bloques
        </p>
      </div>
      <p className={styles.hint} role="status">
        {announcement}
      </p>
    </fieldset>
  );
}
