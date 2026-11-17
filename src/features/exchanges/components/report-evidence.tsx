import type { ExchangeReport } from "../db-contract";
import styles from "../exchanges.module.css";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const FIELD_LABELS: Record<string, string> = {
  name: "Nombre profesional",
  title: "Título",
  role: "Rol",
  description: "Descripción",
  institution: "Institución",
  registration: "Registro declarado",
  engagement: "Contratación",
};

/** Displays only the recorded report evidence, never fetches an unrelated inbox. */
export function ReportEvidence({ report }: { report: ExchangeReport }) {
  if (!isRecord(report.evidence))
    return <p className={styles.meta}>No hay evidencia legible adjunta.</p>;
  const evidence = report.evidence;
  if (Array.isArray(evidence.messages))
    return (
      <div className={styles.compact}>
        <h3>Mensajes incluidos en el reporte</h3>
        <p className={styles.meta}>
          Instantánea limitada de la conversación al reportar. No da acceso a la
          bandeja completa.
        </p>
        <ol className={styles.messages} role="list">
          {evidence.messages
            .filter(isRecord)
            .slice(0, 20)
            .map((message, index) => (
              <li
                key={typeof message.id === "string" ? message.id : index}
                className={styles.message}
              >
                <strong>
                  {message.sender_id === report.reporter_id
                    ? "Persona que reportó"
                    : "Otra persona"}
                </strong>
                <p>
                  {typeof message.body === "string"
                    ? message.body
                    : "Contenido no disponible"}
                </p>
              </li>
            ))}
        </ol>
      </div>
    );
  const data = isRecord(evidence.data) ? evidence.data : evidence;
  return (
    <div className={styles.compact}>
      <h3>Contenido registrado al reportar</h3>
      <dl className={styles.facts}>
        {Object.entries(FIELD_LABELS)
          .filter(([key]) => typeof data[key] === "string")
          .map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd className={styles.prose}>{data[key] as string}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
