"use client";

import { ARTICLE_LIMITS as L, type ArticleBlock } from "./model";
import styles from "./articles.module.css";

type TableBlock = Extract<ArticleBlock, { type: "table" }>;

export function TableEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: TableBlock;
  onChange: (value: TableBlock) => void;
}) {
  function removeColumn(index: number) {
    onChange({
      ...value,
      headers: value.headers.filter((_, i) => i !== index),
      rows: value.rows.map((row) => row.filter((_, i) => i !== index)),
    });
  }
  return (
    <div className={styles.blocks}>
      <p className={styles.hint}>
        Completá un encabezado por columna y los datos de cada fila. La tabla se
        puede desplazar horizontalmente en pantallas pequeñas.
      </p>
      {value.headers.length > 0 && (
        <div
          className={styles.tableWrap}
          role="region"
          aria-label="Editar celdas de la tabla"
          tabIndex={0}
        >
          <table className={styles.table}>
            <caption className="sr-only">
              Encabezados y celdas editables
            </caption>
            <thead>
              <tr>
                {value.headers.map((header, column) => (
                  <th key={column} scope="col">
                    <label
                      htmlFor={`${id}-header-${column}`}
                      className="sr-only"
                    >
                      Encabezado de la columna {column + 1}
                    </label>
                    <input
                      id={`${id}-header-${column}`}
                      name={`${id}-header-${column}`}
                      value={header}
                      maxLength={L.tableHeader}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          headers: value.headers.map((v, i) =>
                            i === column ? event.target.value : v,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() => removeColumn(column)}
                      disabled={value.headers.length <= 1}
                    >
                      Quitar columna {column + 1}
                    </button>
                  </th>
                ))}
                <th scope="col">
                  <span className="sr-only">Acciones de la fila</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {value.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, column) => (
                    <td key={column}>
                      <label
                        className="sr-only"
                        htmlFor={`${id}-${rowIndex}-${column}`}
                      >
                        Fila {rowIndex + 1},{" "}
                        {value.headers[column] || `columna ${column + 1}`}
                      </label>
                      <textarea
                        rows={2}
                        id={`${id}-${rowIndex}-${column}`}
                        name={`${id}-${rowIndex}-${column}`}
                        value={cell}
                        maxLength={L.tableCell}
                        onChange={(event) =>
                          onChange({
                            ...value,
                            rows: value.rows.map((r, i) =>
                              i === rowIndex
                                ? r.map((v, j) =>
                                    j === column ? event.target.value : v,
                                  )
                                : r,
                            ),
                          })
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() =>
                        onChange({
                          ...value,
                          rows: value.rows.filter((_, i) => i !== rowIndex),
                        })
                      }
                    >
                      Quitar fila {rowIndex + 1}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.smallButton}
          disabled={value.headers.length >= L.tableColumns}
          onClick={() =>
            onChange({
              ...value,
              headers: [...value.headers, ""],
              rows: value.rows.map((row) => [...row, ""]),
            })
          }
        >
          Agregar columna
        </button>
        <button
          type="button"
          className={styles.smallButton}
          disabled={!value.headers.length || value.rows.length >= L.tableRows}
          onClick={() =>
            onChange({
              ...value,
              rows: [...value.rows, value.headers.map(() => "")],
            })
          }
        >
          Agregar fila
        </button>
      </div>
    </div>
  );
}
