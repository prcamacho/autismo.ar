"use client";

import { useActionState, useRef, useState } from "react";
import type { ArticleProfile } from "./db-contract";
import { cafecitoUrl, parseCafecitoEmbed } from "./cafecito";
import { saveAuthorProfile } from "./actions";
import styles from "@/components/ui.module.css";

export function AuthorProfileForm({
  profile,
}: {
  profile: ArticleProfile | null;
}) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [embed, setEmbed] = useState(
    profile?.cafecito_slug ? cafecitoUrl(profile.cafecito_slug) : "",
  );
  const [submittedEmbed, setSubmittedEmbed] = useState<string | null>(null);
  const [result, action, pending] = useActionState(
    async (
      previous: Awaited<ReturnType<typeof saveAuthorProfile>>,
      form: FormData,
    ) => {
      setSubmittedEmbed(String(form.get("cafecito") || ""));
      return saveAuthorProfile(previous, form);
    },
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const revision = result.revision ?? profile?.revision ?? 0;
  return (
    <form
      ref={formRef}
      action={action}
      className={styles.form}
      aria-labelledby="author-form-title"
    >
      <h2 id="author-form-title">Tu firma y tu botón de apoyo</h2>
      <input name="revision" type="hidden" value={revision} />
      <fieldset disabled={pending} className={styles.stack}>
        <legend>Datos del perfil de autor</legend>
        <div className="form-field">
          <label htmlFor="author-name">Nombre público (obligatorio)</label>
          <input
            id="author-name"
            name="name"
            autoComplete="nickname"
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            aria-describedby="author-name-help"
          />
          <p id="author-name-help" className={styles.meta}>
            Es la firma visible de tus artículos. No necesitás publicar tu
            nombre completo ni tu correo. Cambiarla también requiere revisar
            nuevamente el botón de Cafecito.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="author-cafecito">Botón de Cafecito (opcional)</label>
          <textarea
            id="author-cafecito"
            name="cafecito"
            rows={5}
            maxLength={10000}
            value={embed}
            onChange={(event) => {
              setEmbed(event.target.value);
              setPreview(null);
              setPreviewMessage("");
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="cafecito-help cafecito-error"
            aria-invalid={
              embed === submittedEmbed && Boolean(result.fieldErrors?.cafecito)
            }
          />
          <p id="cafecito-help" className={styles.meta}>
            Pegá el código del botón que ofrece tu perfil de Cafecito, o su
            enlace completo. Dejá el campo vacío para quitarlo de todos tus
            artículos. Un destino nuevo necesita revisión.
          </p>
          <p id="cafecito-error" className={styles.meta}>
            {embed === submittedEmbed && result.fieldErrors?.cafecito}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              const raw = String(
                new FormData(formRef.current!).get("cafecito") || "",
              );
              const parsed = parseCafecitoEmbed(raw);
              setPreview(parsed?.url ?? null);
              setPreviewMessage(
                parsed
                  ? "Revisá que este sea tu perfil antes de guardar."
                  : raw.trim()
                    ? "No reconocimos el botón. Pegá el código oficial o el enlace completo de tu perfil."
                    : "El perfil quedará sin botón de Cafecito.",
              );
            }}
          >
            Comprobar destino
          </button>
          <button className="button" type="submit">
            {pending ? "Guardando…" : "Guardar perfil"}
          </button>
        </div>
      </fieldset>
      <div role="status">
        {previewMessage && <p>{previewMessage}</p>}
        {preview && (
          <p>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {preview} <span className="sr-only">(abre otra pestaña)</span>
            </a>
          </p>
        )}
      </div>
      <div role="status">
        {result.message && (
          <p className={styles.feedback} data-ok={Boolean(result.ok)}>
            {result.message}
          </p>
        )}
      </div>
    </form>
  );
}
