"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  ARTICLE_LIMITS as L,
  createEmptyArticle,
  type ArticleInput,
} from "./model";
import { articleDraftSchema } from "./validation";
import { articleSummary } from "./content";
import {
  createEditorSnapshot,
  reconcileEditorSnapshot,
  type EditorSnapshot,
} from "./editor-revision";
import { ArticleContent } from "./article-content";
import { BlockEditor } from "./block-editor";
import { EditorTextField } from "./editor-fields";
import {
  AgendaEditor,
  ArticleAppearance,
  ArticleDetails,
  SourcesEditor,
} from "./editor-sections";
import styles from "./articles.module.css";

export type ArticleEditorResult = {
  ok?: boolean;
  message?: string;
  id?: string;
  revision?: number;
  fieldErrors?: Record<string, string>;
};
type SaveState = ArticleEditorResult & {
  submittedContent?: string;
  confirmedSnapshot?: EditorSnapshot;
};
const subscribe = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

export function ArticleEditor({
  initial,
  id,
  revision = 0,
  saveAction,
  canSave,
  cafecitoAvailable = false,
}: {
  initial?: ArticleInput;
  id?: string;
  revision?: number;
  saveAction: (
    previous: ArticleEditorResult,
    form: FormData,
  ) => Promise<ArticleEditorResult>;
  canSave: boolean;
  cafecitoAvailable?: boolean;
}) {
  const [article, setArticle] = useState<ArticleInput>(
    () => initial ?? createEmptyArticle(),
  );
  const [confirmedSnapshot, setConfirmedSnapshot] = useState(() =>
    createEditorSnapshot(id, revision, initial ?? createEmptyArticle()),
  );
  const [preview, setPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [beforeImport, setBeforeImport] = useState<ArticleInput | null>(null);
  const feedbackElement = useRef<HTMLDivElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const prefix = useId();
  const hydrated = useSyncExternalStore(
    subscribe,
    hydratedSnapshot,
    serverSnapshot,
  );
  const [state, dispatch, pending] = useActionState<SaveState, FormData>(
    async (previous, form) => {
      const submittedContent = String(form.get("content") || "");
      try {
        const result = await saveAction(
          { id: previous.id, revision: previous.revision },
          form,
        );
        return {
          ...previous,
          ...result,
          ok: Boolean(result.ok),
          fieldErrors: result.fieldErrors,
          submittedContent,
          confirmedSnapshot:
            result.ok && result.id && result.revision !== undefined
              ? createEditorSnapshot(
                  result.id,
                  result.revision,
                  JSON.parse(submittedContent),
                )
              : previous.confirmedSnapshot,
        };
      } catch {
        return {
          id: previous.id,
          revision: previous.revision,
          confirmedSnapshot: previous.confirmedSnapshot,
          message:
            "No pudimos completar el guardado. Tu texto sigue en el editor; descargá una copia antes de volver a intentar.",
          submittedContent,
        };
      }
    },
    {},
  );
  const serialized = JSON.stringify(article);
  const serverContentSnapshot = useMemo(
    () => createEditorSnapshot(id, revision, initial),
    [id, revision, initial],
  );
  const latestConfirmed =
    state.confirmedSnapshot &&
    state.confirmedSnapshot.revision > confirmedSnapshot.revision
      ? state.confirmedSnapshot
      : confirmedSnapshot;
  const synchronizedSnapshot = reconcileEditorSnapshot(
    latestConfirmed,
    serverContentSnapshot,
    pending,
  );
  // A status action can advance revision without changing the saved text. Keep
  // that newer baseline, but never replace local edits or accept changed content.
  if (synchronizedSnapshot !== confirmedSnapshot)
    setConfirmedSnapshot(synchronizedSnapshot);
  const currentId = synchronizedSnapshot.id || id;
  const currentRevision = synchronizedSnapshot.revision;
  const responseIsCurrent =
    state.submittedContent === serialized &&
    (!state.ok || state.revision === currentRevision);

  useEffect(() => {
    if (state.ok && state.id) {
      if (!id) router.replace(`/cuenta/articulos/${state.id}`);
      else router.refresh();
    }
    if (state.message) feedbackElement.current?.focus();
  }, [state, id, router]);

  function change(next: ArticleInput) {
    setArticle(next);
    setError("");
    setFeedback("");
  }
  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => feedbackElement.current?.focus());
  }

  function validateDraft() {
    const parsed = articleDraftSchema.safeParse(article);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const sections: Record<string, string> = {
        title: "el título",
        summary: "el resumen",
        blocks: "los bloques de contenido",
        agenda: "las fechas de la agenda",
        sources: "las fuentes",
        province: "la provincia",
        locality: "la localidad",
        expiresOn: "la fecha de vigencia",
      };
      showError(
        `Revisá ${sections[String(first.path[0])] || "el contenido"}: hay un dato incompleto, inválido o más largo que el límite permitido. Conservamos lo que escribiste.`,
      );
      return null;
    }
    return parsed.data;
  }

  function downloadDraft() {
    const content = validateDraft();
    if (!content) return;
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            { format: "autismo.ar/article", version: 1, content },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "articulo-autismo-ar.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback(
        "Se preparó la descarga del borrador. Guardá el archivo para continuar después; esto no publica ni envía el artículo.",
      );
    } catch {
      showError(
        "No pudimos preparar la descarga. Conservá el texto y volvé a intentar.",
      );
    }
  }

  async function importDraft(file: File | undefined) {
    if (!file) return;
    if (file.size > L.documentBytes * 2) {
      showError("El archivo es demasiado grande para un borrador de artículo.");
      return;
    }
    setImporting(true);
    try {
      const saved = JSON.parse(await file.text());
      if (saved?.format !== "autismo.ar/article" || saved?.version !== 1)
        throw new Error("format");
      const parsed = articleDraftSchema.safeParse(saved.content);
      if (!parsed.success) throw new Error("content");
      setBeforeImport(article);
      change(parsed.data);
      setFeedback(
        "Borrador cargado en este editor. Todavía no se guardó en tu cuenta ni se publicó.",
      );
    } catch {
      showError(
        "No pudimos abrir ese borrador. Usá un archivo JSON descargado desde este editor. Tu contenido actual se conservó.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={styles.editor}>
      <noscript>
        <p className={styles.notice}>
          El editor necesita JavaScript para organizar los bloques y guardar el
          contenido. Activá JavaScript y recargá esta página. Los artículos
          publicados se pueden leer sin activarlo.
        </p>
      </noscript>
      <p className={styles.notice}>
        Publicá información que puedas compartir. No incluyas datos
        identificatorios de menores, documentación médica ni domicilios
        particulares.
      </p>
      {!canSave && (
        <p className={styles.notice}>
          El guardado en tu cuenta no está disponible en esta sesión. Podés
          preparar el artículo y descargar un borrador para conservarlo en tu
          dispositivo.
        </p>
      )}
      <form
        action={dispatch}
        className={styles.editor}
        aria-label="Editar artículo"
        onSubmit={(event) => {
          if (!canSave || !validateDraft()) {
            event.preventDefault();
            return;
          }
          setFeedback("");
          setError("");
        }}
      >
        <input type="hidden" name="content" value={serialized} />
        <input type="hidden" name="id" value={currentId || ""} />
        <input type="hidden" name="revision" value={currentRevision} />
        <fieldset
          disabled={!hydrated || pending || importing}
          className={styles.fieldset}
        >
          <legend className="sr-only">
            Contenido y presentación del artículo
          </legend>
          <ArticleDetails value={article} onChange={change} />
          {(article.kind === "agenda" || article.agenda.length > 0) && (
            <AgendaEditor
              rows={article.agenda}
              onChange={(agenda) => change({ ...article, agenda })}
            />
          )}
          <BlockEditor
            blocks={article.blocks}
            onChange={(blocks) => change({ ...article, blocks })}
          />
          <SourcesEditor
            sources={article.sources}
            onChange={(sources) => change({ ...article, sources })}
          />
          <fieldset className={styles.section}>
            <legend>Resumen para compartir</legend>
            <EditorTextField
              id={`${prefix}-summary`}
              label="Resumen personalizado (opcional)"
              value={article.summary}
              maxLength={L.summary}
              rows={4}
              hint="Si lo dejás vacío, se prepara un resumen a partir de las fechas o del contenido. Las redes pueden recortarlo."
              onChange={(summary) => change({ ...article, summary })}
            />
            <div className={styles.previewCard}>
              <strong>{article.title || "Título del artículo"}</strong>
              <p>
                {articleSummary(article) ||
                  "El adelanto aparecerá cuando escribas contenido."}
              </p>
            </div>
            <p className={styles.hint}>
              Vista orientativa. Cada red decide cómo mostrar el título y el
              resumen.
            </p>
          </fieldset>
          <ArticleAppearance
            value={article}
            onChange={change}
            cafecitoAvailable={cafecitoAvailable}
          />
          <div className={styles.toolbar}>
            <button type="submit" className="button" disabled={!canSave}>
              {pending
                ? "Guardando borrador…"
                : "Guardar borrador en mi cuenta"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              aria-expanded={preview}
              aria-controls={`${prefix}-preview`}
              onClick={() => {
                setPreview(!preview);
                if (!preview)
                  requestAnimationFrame(() => previewHeading.current?.focus());
              }}
            >
              {preview ? "Cerrar vista previa" : "Ver vista previa"}
            </button>
          </div>
          <p className={styles.hint}>
            Guardar conserva un borrador privado. Después podrás enviarlo a
            revisión desde la página del artículo guardado.
          </p>
          <details className={styles.section}>
            <summary>Conservar una copia en mi dispositivo</summary>
            <p className={styles.hint}>
              El archivo contiene el texto completo del borrador. Guardalo en un
              lugar privado. La importación reemplaza el contenido del editor y
              permite deshacer ese cambio.
            </p>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.smallButton}
                onClick={downloadDraft}
              >
                Descargar borrador JSON
              </button>
              {beforeImport && (
                <button
                  type="button"
                  className={styles.smallButton}
                  onClick={() => {
                    change(beforeImport);
                    setBeforeImport(null);
                    setFeedback(
                      "Se recuperó el contenido anterior a la importación.",
                    );
                  }}
                >
                  Deshacer importación
                </button>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${prefix}-file`}>Cargar un borrador JSON</label>
              <input
                id={`${prefix}-file`}
                name="draft-file"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void importDraft(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          </details>
        </fieldset>
      </form>
      <div ref={feedbackElement} tabIndex={-1} aria-live="polite">
        {importing && <p className={styles.notice}>Abriendo borrador…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {feedback && <p className={styles.notice}>{feedback}</p>}
        {responseIsCurrent && state.message && (
          <div className={state.ok ? styles.success : styles.error}>
            <p>{state.message}</p>
            {state.fieldErrors && (
              <ul>
                {Object.values(state.fieldErrors).map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {preview && (
        <section
          className={styles.preview}
          id={`${prefix}-preview`}
          aria-labelledby={`${prefix}-preview-title`}
        >
          <p className={styles.hint}>Vista previa del contenido · Borrador</p>
          <h2
            ref={previewHeading}
            tabIndex={-1}
            id={`${prefix}-preview-title`}
            className={styles.previewTitle}
          >
            {article.title || "Artículo sin título"}
          </h2>
          <ArticleContent article={article} preview />
        </section>
      )}
    </div>
  );
}
