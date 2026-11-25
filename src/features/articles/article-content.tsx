import { Fragment } from "react";
import { isPublicHttpUrl } from "@/lib/public-url";
import { AGENDA_KINDS, type ArticleInput } from "./model";
import { articleInlineText, formatArticleDate } from "./content";
import { youtubeVideoId, youtubeWatchUrl } from "./youtube";
import { YouTubeVideo } from "./youtube-video";
import styles from "./articles.module.css";

function InlineText({ text }: { text: string }) {
  return articleInlineText(text).map((part, index) =>
    part.bold ? (
      <strong key={index}>{part.text}</strong>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}

/** Shared renderer for the editor, moderation and approved publications. No raw HTML. */
export function ArticleContent({
  article,
  preview = false,
}: {
  article: ArticleInput;
  preview?: boolean;
}) {
  return (
    <div
      className={styles.article}
      data-accent={article.theme}
      data-heading={article.headingStyle}
    >
      {article.agenda.length > 0 && (
        <section aria-label="Fechas de la agenda">
          <h2 className={styles.sectionHeading}>Fechas de la agenda</h2>
          <ol className={styles.agenda}>
            {article.agenda.map((row, index) => (
              <li key={index} className={styles.agendaItem}>
                <div className={styles.agendaDate}>
                  {row.date ? (
                    <time dateTime={row.date}>
                      {formatArticleDate(row.date)}
                    </time>
                  ) : (
                    "Fecha pendiente"
                  )}
                  <span>{AGENDA_KINDS[row.kind]}</span>
                </div>
                <div>
                  <h3>{row.title || "Especialidad o actividad pendiente"}</h3>
                  {row.details && (
                    <p className={styles.paragraph}>{row.details}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {article.blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={index} className={styles.sectionHeading}>
                <InlineText text={block.text} />
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className={styles.paragraph}>
                <InlineText text={block.text} />
              </p>
            );
          case "callout":
            return (
              <aside key={index} className={styles.callout}>
                <InlineText text={block.text} />
              </aside>
            );
          case "list":
            return (
              <ul key={index} className={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "link":
            return (
              <p key={index}>
                {isPublicHttpUrl(block.url) ? (
                  <a
                    href={block.url}
                    className={styles.external}
                    rel="ugc nofollow noopener noreferrer"
                    target="_blank"
                  >
                    {block.label || block.url}
                    <span className="sr-only"> (otra pestaña)</span> ↗
                  </a>
                ) : (
                  <span>
                    {block.label || "Enlace pendiente"}
                    {preview && " · Completá un destino válido."}
                  </span>
                )}
              </p>
            );
          case "youtube": {
            const videoId = youtubeVideoId(block.url);
            if (!videoId)
              return (
                <p key={index} className={styles.notice}>
                  {preview
                    ? "Completá un enlace válido de YouTube para previsualizar el video."
                    : "El enlace de este video no está disponible."}
                </p>
              );
            return block.display === "embed" ? (
              <YouTubeVideo
                key={`${index}-${videoId}`}
                videoId={videoId}
                label={block.label}
              />
            ) : (
              <p key={index}>
                <a
                  href={youtubeWatchUrl(videoId)}
                  className={styles.external}
                  rel="ugc nofollow noopener noreferrer"
                  target="_blank"
                >
                  {block.label || "Ver en YouTube"}
                  <span className="sr-only"> (otra pestaña)</span> ↗
                </a>
              </p>
            );
          }
          case "table":
            return (
              <div
                key={index}
                className={styles.tableWrap}
                role="region"
                aria-label={`Tabla de información ${index + 1}`}
                tabIndex={0}
              >
                <table className={styles.table}>
                  <caption className="sr-only">
                    Tabla de información {index + 1}
                  </caption>
                  <thead>
                    <tr>
                      {block.headers.map((header, column) => (
                        <th key={column} scope="col">
                          <InlineText text={header} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, column) => (
                          <td key={column}>
                            <InlineText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
      {article.blocks.length === 0 &&
        article.agenda.length === 0 &&
        preview && (
          <p className={styles.muted}>
            Tu contenido aparecerá aquí cuando agregues un bloque o una fecha.
          </p>
        )}
      {article.sources.length > 0 && (
        <section className={styles.sources} aria-label="Fuentes del artículo">
          <h2 className={styles.sectionHeading}>Fuentes</h2>
          <ul className={styles.list}>
            {article.sources.map((source, index) => (
              <li key={index}>
                {isPublicHttpUrl(source.url) ? (
                  <a
                    href={source.url}
                    className={styles.external}
                    target="_blank"
                    rel="ugc nofollow noopener noreferrer"
                  >
                    {source.label || source.url}
                    <span className="sr-only"> (otra pestaña)</span> ↗
                  </a>
                ) : (
                  <span>{source.label || "Fuente pendiente"}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
