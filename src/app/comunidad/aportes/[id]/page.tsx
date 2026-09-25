import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/features/auth/session";
import { getProposal, getChecks } from "@/features/community/repository";
import { getResource } from "@/features/resources/repository";
import {
  checkFields,
  proposalStatuses,
  type CheckField,
} from "@/features/community/model";
import { fieldValue, requiredFields } from "@/features/community/fields";
import { ConnectionNotice, formatDate } from "@/features/community/components";
import { ActionForm } from "@/features/community/action-form";
import { submitCheck, moderateProposal } from "@/features/community/actions";
import styles from "@/features/community/community.module.css";
export const metadata = {
  title: "Revisar aporte",
  robots: { index: false, follow: false },
};
export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const viewer = await getViewer();
  if (!viewer)
    return (
      <div className="container section">
        <div className={styles.card}>
          <h1>Ingresá para consultar este aporte</h1>
          <p>
            Los aportes pendientes solo se muestran a las personas que
            participan de la revisión.
          </p>
          <Link className="button" href="/cuenta">
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    );
  const result = await getProposal(id);
  if (result.status !== "ready")
    return (
      <div className="container section">
        <ConnectionNotice status={result.status} />
      </div>
    );
  if (!result.data) notFound();
  const p = result.data;
  const [checks, current] = await Promise.all([
    getChecks(id),
    p.resource_id ? getResource(p.resource_id) : Promise.resolve(null),
  ]);
  const required = requiredFields(p.data, current?.data?.data);
  const own = p.author_id === viewer.id;
  const stale =
    p.resource_id &&
    p.status !== "approved" &&
    current?.data &&
    current.data.version !== p.base_version;
  const actionable = p.status === "submitted" || p.status === "reviewing";
  return (
    <div className="container section">
      <div className={styles.stack}>
        <Link
          className="text-link"
          href={own ? "/cuenta" : "/comunidad/revisar"}
        >
          ← {own ? "Mis aportes" : "Volver a revisión"}
        </Link>
        <div className={styles.topline}>
          <span className={styles.status} data-status={p.status}>
            {proposalStatuses[p.status].label}
          </span>
          <span className={styles.meta}>{formatDate(p.created_at)}</span>
        </div>
        <h1>{p.data.name}</h1>
        <p className={styles.lead}>{proposalStatuses[p.status].description}</p>
        {stale && (
          <div className={styles.callout}>
            <strong>La ficha cambió desde este aporte</strong>
            <p>
              Esta propuesta no se puede publicar sobre una versión distinta.
              Prepará una nueva corrección desde la ficha actual.
            </p>
          </div>
        )}
        <div className={styles.layout}>
          <div className={styles.stack}>
            <section className={styles.card}>
              <h2>
                {p.resource_id ? "Cambios propuestos" : "Información propuesta"}
              </h2>
              <dl className={styles.data}>
                {(Object.keys(checkFields) as CheckField[]).map((field) => (
                  <div key={field}>
                    <dt>
                      {checkFields[field]}{" "}
                      {actionable &&
                        required.includes(field) &&
                        "· Requiere corroboración"}
                    </dt>
                    <dd>
                      {current?.data && actionable ? (
                        <div className={styles.compare}>
                          <div>
                            <strong>Ficha actual</strong>
                            {fieldValue(current.data.data, field)}
                          </div>
                          <div>
                            <strong>Propuesta</strong>
                            {fieldValue(p.data, field)}
                          </div>
                        </div>
                      ) : (
                        fieldValue(p.data, field)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                className={styles.external}
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Abrir fuente del aporte ↗
                <span className="sr-only"> (otra pestaña)</span>
              </a>
              <h3>Contexto del aporte</h3>
              <p>{p.note}</p>
              {p.decision_note && (
                <>
                  <h3>Respuesta de moderación</h3>
                  <p>{p.decision_note}</p>
                </>
              )}
            </section>
            <section className={styles.card}>
              <h2>Corroboraciones</h2>
              <ConnectionNotice status={checks.status} />
              {checks.status === "ready" && checks.data.length === 0 && (
                <p>Todavía no se contrastaron datos de este aporte.</p>
              )}
              <ul className={styles.timeline}>
                {checks.data.map((check) => (
                  <li key={check.id}>
                    <strong>
                      {checkFields[check.field]} ·{" "}
                      {check.verdict === "matches"
                        ? "Coincide con la fuente"
                        : "Hay diferencias"}
                      {check.reviewer_id === viewer.id ? " · Tu revisión" : ""}
                    </strong>
                    <span className={styles.meta}>
                      {formatDate(check.checked_at)} ·{" "}
                      <a
                        className={styles.external}
                        href={check.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        Fuente consultada ↗
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className={styles.stack}>
            {p.resource_id && (
              <Link
                className="button button-secondary"
                href={`/directorio/${p.resource_id}`}
              >
                Ver ficha publicada
              </Link>
            )}
            {p.status === "reviewing" && !own && !stale && (
              <section className={styles.card}>
                <h2>Corroborar un dato</h2>
                <p>
                  Consultá la fuente antes de marcar una coincidencia. Podés
                  corregir tu revisión volviendo a enviar el mismo campo.
                </p>
                <ActionForm action={submitCheck} label="Guardar corroboración">
                  <input name="proposal" type="hidden" value={id} />
                  <div className="form-field">
                    <label htmlFor="check-field">Dato que revisaste</label>
                    <select id="check-field" name="field" required>
                      {(Object.keys(checkFields) as CheckField[]).map((f) => (
                        <option key={f} value={f}>
                          {checkFields[f]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="verdict">Resultado</label>
                    <select id="verdict" name="verdict">
                      <option value="matches">Coincide con la fuente</option>
                      <option value="disagrees">Hay diferencias</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="check-source">Fuente que consultaste</label>
                    <input
                      type="url"
                      name="source"
                      id="check-source"
                      maxLength={1000}
                      required
                    />
                  </div>
                  <label className={styles.choice}>
                    <input type="checkbox" name="independent" required />
                    Lo comprobé de forma independiente y no tengo un interés
                    personal o comercial en el recurso.
                  </label>
                </ActionForm>
              </section>
            )}
            {own && actionable && (
              <div className={styles.callout}>
                <strong>Este es tu aporte</strong>
                <p>
                  La corroboración y la decisión tienen que hacerlas otras
                  personas.
                </p>
              </div>
            )}
            {viewer.moderator && !own && actionable && (
              <section className={styles.card}>
                <h2>Moderación</h2>
                <p>
                  Revisá que no haya datos privados, promesas sin sustento ni
                  duplicados antes de habilitar la revisión.
                </p>
                <Link
                  target="_blank"
                  href={`/directorio?q=${encodeURIComponent(p.data.name)}`}
                  className="text-link"
                >
                  Buscar posibles duplicados ↗
                </Link>
                <ActionForm action={moderateProposal} label="Guardar decisión">
                  <input type="hidden" name="proposal" value={id} />
                  <div className="form-field">
                    <label htmlFor="decision">Decisión</label>
                    <select name="decision" id="decision">
                      {p.status === "submitted" ? (
                        <option value="reviewing">
                          Habilitar corroboración
                        </option>
                      ) : (
                        <option value="approved">
                          Publicar tras corroborar los datos
                        </option>
                      )}
                      <option value="rejected">
                        No incorporar este aporte
                      </option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="decision-note">
                      Motivo (lo verá quien aportó)
                    </label>
                    <textarea
                      id="decision-note"
                      name="note"
                      minLength={10}
                      maxLength={1000}
                      required
                      rows={4}
                    />
                  </div>
                </ActionForm>
              </section>
            )}
            {p.status === "rejected" && own && (
              <div className={styles.card}>
                <h3>Podés preparar otro aporte</h3>
                <p>
                  Tomá el motivo de moderación como referencia y adjuntá una
                  fuente que permita revisarlo.
                </p>
                <Link
                  className="text-link"
                  href={
                    p.resource_id
                      ? `/aportar?ficha=${p.resource_id}`
                      : "/aportar"
                  }
                >
                  Preparar una nueva propuesta →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
