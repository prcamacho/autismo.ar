import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getResource,
  getConfirmations,
  getResourceHistory,
} from "@/features/resources/repository";
import { checkFields, type CheckField } from "@/features/community/model";
import { fieldValue } from "@/features/community/fields";
import {
  ConnectionNotice,
  formatDate,
  Pagination,
  readPage,
} from "@/features/community/components";
import { ActionForm } from "@/features/community/action-form";
import { reportResource } from "@/features/community/actions";
import { getViewer } from "@/features/auth/session";
import styles from "@/features/community/community.module.css";

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const page = readPage((await searchParams).pagina);
  const result = await getResource(slug);
  if (result.status !== "ready")
    return (
      <div className="container section">
        <ConnectionNotice status={result.status} />
      </div>
    );
  if (!result.data) notFound();
  const resource = result.data;
  const [confirmations, history, viewer] = await Promise.all([
    getConfirmations(resource.id),
    getResourceHistory(resource.id, page),
    getViewer(),
  ]);
  return (
    <div className="container section">
      <div className={styles.stack}>
        <Link href="/directorio" className="text-link">
          ← Volver al directorio
        </Link>
        <div>
          <p className="eyebrow">
            FICHA COMUNITARIA · VERSIÓN {resource.version}
          </p>
          <h1>{resource.data.name}</h1>
          <p className={styles.lead}>
            {fieldValue(resource.data, "location")} · Actualizada{" "}
            {formatDate(resource.published_at)}
          </p>
        </div>
        <div className={styles.layout}>
          <div className={styles.stack}>
            <div className={styles.card}>
              <dl className={styles.data}>
                {(Object.keys(checkFields) as CheckField[])
                  .filter((f) => f !== "name")
                  .map((field) => {
                    const confirmation = confirmations.data.find(
                      (c) => c.field === field,
                    );
                    return (
                      <div key={field}>
                        <dt>{checkFields[field]}</dt>
                        <dd>
                          {fieldValue(resource.data, field)}
                          {confirmation && (
                            <small>
                              Corroborado el{" "}
                              {formatDate(confirmation.confirmed_at)} ·{" "}
                              <a
                                className={styles.external}
                                href={confirmation.source_url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                              >
                                Consultar fuente{" "}
                                <span className="sr-only">(otra pestaña)</span>
                              </a>
                            </small>
                          )}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              {resource.data.website && (
                <a
                  className="button button-secondary"
                  href={resource.data.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Visitar el sitio del recurso ↗
                  <span className="sr-only"> (otra pestaña)</span>
                </a>
              )}
              <a
                className={styles.external}
                href={resource.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Fuente del aporte publicado ↗
                <span className="sr-only"> (otra pestaña)</span>
              </a>
              <ConnectionNotice status={confirmations.status} />
            </div>
            <section className={styles.card} aria-labelledby="history-title">
              <h2 id="history-title">Historial de esta ficha</h2>
              <p>
                Podés usar una versión anterior para proponer una nueva
                corrección. También necesita revisión.
              </p>
              <ConnectionNotice status={history.status} />
              <ol className={styles.timeline}>
                {history.data.slice(0, 20).map((revision) => (
                  <li key={revision.version}>
                    <strong>
                      Versión {revision.version} ·{" "}
                      {formatDate(revision.published_at)}
                    </strong>
                    <details>
                      <summary>Ver información de esta versión</summary>
                      <dl className={styles.data}>
                        {(Object.keys(checkFields) as CheckField[]).map((f) => (
                          <div key={f}>
                            <dt>{checkFields[f]}</dt>
                            <dd>{fieldValue(revision.data, f)}</dd>
                          </div>
                        ))}
                      </dl>
                      <a
                        className={styles.external}
                        href={revision.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        Fuente de esta versión ↗
                      </a>
                      {revision.version < resource.version && (
                        <p>
                          <Link
                            className="text-link"
                            href={`/aportar?ficha=${resource.slug}&version=${revision.version}`}
                          >
                            Proponer recuperar estos datos
                          </Link>
                        </p>
                      )}
                    </details>
                  </li>
                ))}
              </ol>
              <Pagination
                page={page}
                hasMore={history.data.length > 20}
                href={`/directorio/${slug}`}
              />
            </section>
          </div>
          <aside className={styles.stack}>
            <div className={styles.card}>
              <h3>¿Cambió algún dato?</h3>
              <p>
                Una corrección ayuda a todas las personas que consultan esta
                ficha.
              </p>
              <Link href={`/aportar?ficha=${resource.slug}`} className="button">
                Proponer una corrección
              </Link>
            </div>
            <div className={styles.callout}>
              <strong>Qué significa corroborar</strong>
              <p>
                Se contrastó un dato con una fuente en una fecha. No certifica
                calidad clínica, credenciales ni disponibilidad actual. Consultá
                directamente la cobertura y los turnos.
              </p>
            </div>
            <details className={styles.details}>
              <summary>Reportar un problema</summary>
              <p className={styles.meta}>
                El reporte es privado para vos y moderación. No incluyas
                documentación médica ni datos de menores.
              </p>
              {viewer ? (
                <ActionForm action={reportResource} label="Enviar reporte">
                  <input type="hidden" name="resource" value={resource.id} />
                  <div className="form-field">
                    <label htmlFor="reason">Qué problema encontraste</label>
                    <textarea
                      name="reason"
                      id="reason"
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      required
                    />
                  </div>
                </ActionForm>
              ) : (
                <Link href="/cuenta" className="text-link">
                  Ingresar para reportar
                </Link>
              )}
            </details>
          </aside>
        </div>
      </div>
    </div>
  );
}
