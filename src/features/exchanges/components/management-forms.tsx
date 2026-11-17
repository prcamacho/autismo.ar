"use client";

import { changeListingState, moderateEntry, resolveReport } from "../actions";
import { MutationForm } from "./mutation-form";
import { CheckField, RadioChoices, TextAreaField } from "./fields";
import styles from "../exchanges.module.css";

export function ListingStateForm({
  id,
  state,
}: {
  id: string;
  state: "renew" | "paused" | "closed" | "delete";
}) {
  const labels = {
    renew: "Reconfirmar disponibilidad y renovar",
    paused: "Pausar publicación",
    closed: "Cerrar publicación",
    delete: "Eliminar publicación",
  };
  return (
    <MutationForm
      action={changeListingState}
      key={`${id}:${state}`}
      legend={labels[state]}
      label={labels[state]}
      successHref={
        state === "delete" ? "/busquedas/mis-publicaciones" : undefined
      }
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="state" value={state} />
      {state === "delete" && (
        <>
          <p className={styles.meta}>
            La publicación se retirará. Las conversaciones existentes mantienen
            sus reglas de privacidad y conservación.
          </p>
          <CheckField
            name="confirm"
            label="Confirmo que quiero eliminar esta publicación."
            required
          />
        </>
      )}
    </MutationForm>
  );
}
export function ModerationForm({
  kind,
  id,
  version,
}: {
  kind: "profile" | "listing";
  id: string;
  version: number;
}) {
  return (
    <MutationForm
      action={moderateEntry}
      key={`${kind}:${id}:${version}`}
      legend="Decisión de moderación"
      label="Guardar decisión"
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <RadioChoices
        name="decision"
        legend="Resultado"
        options={{
          approved: "Aprobar publicación",
          rejected: "Solicitar cambios",
        }}
        value="rejected"
      />
      <TextAreaField
        name="note"
        label="Motivo para la persona autora"
        required
        minLength={10}
        maxLength={1000}
        help="Revisá pertinencia y privacidad. Esta aprobación no certifica credenciales ni calidad profesional."
      />
    </MutationForm>
  );
}
export function ResolveReportForm({ id }: { id: string }) {
  return (
    <MutationForm
      action={resolveReport}
      key={id}
      legend="Resolver reporte"
      label="Guardar resolución"
    >
      <input type="hidden" name="id" value={id} />
      <TextAreaField
        name="note"
        label="Motivo de la resolución"
        required
        minLength={10}
        maxLength={1000}
      />
      <CheckField
        name="hide"
        label="Retirar el contenido reportado o detener el contacto según corresponda."
      />
    </MutationForm>
  );
}
