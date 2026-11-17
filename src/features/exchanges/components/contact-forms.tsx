"use client";

import {
  blockContact,
  deleteExchangeAccount,
  reportEntry,
  requestContact,
  respondContact,
  sendMessage,
} from "../actions";
import { EXCHANGE_LIMITS } from "../model";
import { MutationForm } from "./mutation-form";
import { CheckField, TextAreaField, TextField } from "./fields";
import styles from "../exchanges.module.css";

export function RequestContactForm({
  listingId,
  nonce,
  disabled = false,
}: {
  listingId: string;
  nonce: string;
  disabled?: boolean;
}) {
  return (
    <MutationForm
      action={requestContact}
      key={listingId}
      legend="Presentate para iniciar el contacto"
      label="Enviar solicitud de contacto"
      initialNonce={nonce}
      disabled={disabled}
      successHref="/mensajes/:id"
      redirectOnSuccess
    >
      <input type="hidden" name="listing" value={listingId} />
      <TextAreaField
        name="body"
        label="Presentación breve"
        required
        minLength={10}
        maxLength={EXCHANGE_LIMITS.introduction}
        help="Hasta 800 caracteres. Tu teléfono y tu correo no se comparten. La otra persona podrá aceptar, rechazar o bloquear la solicitud."
      />
      <p className={styles.meta}>
        Podés iniciar hasta 5 solicitudes por día. Evitá compartir datos de
        menores o información médica.
      </p>
    </MutationForm>
  );
}
export function MessageForm({
  conversationId,
  nonce,
}: {
  conversationId: string;
  nonce: string;
}) {
  return (
    <MutationForm
      action={sendMessage}
      key={conversationId}
      legend="Escribir un mensaje"
      label="Enviar mensaje"
      initialNonce={nonce}
      resetOnSuccess
    >
      <input type="hidden" name="conversation" value={conversationId} />
      <TextAreaField
        name="body"
        label="Mensaje"
        required
        minLength={1}
        maxLength={EXCHANGE_LIMITS.message}
        help="Hasta 2.000 caracteres. El contenido es privado; compartir otro medio de contacto es una decisión tuya."
      />
    </MutationForm>
  );
}
export function RespondContactForm({ id }: { id: string }) {
  return (
    <div className={styles.columns}>
      {(["accepted", "rejected"] as const).map((decision) => (
        <MutationForm
          key={`${id}:${decision}`}
          action={respondContact}
          legend={
            decision === "accepted"
              ? "Continuar la conversación"
              : "Declinar el contacto"
          }
          label={
            decision === "accepted" ? "Aceptar solicitud" : "Rechazar solicitud"
          }
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value={decision} />
          <p className={styles.meta}>
            {decision === "accepted"
              ? "Aceptarla habilita el intercambio de mensajes dentro del sitio."
              : "La otra persona no podrá enviar mensajes en esta conversación."}
          </p>
        </MutationForm>
      ))}
    </div>
  );
}
export function BlockContactForm({ id }: { id: string }) {
  return (
    <details className={styles.disclosure}>
      <summary>Bloquear este contacto</summary>
      <MutationForm
        action={blockContact}
        key={id}
        legend="Bloqueo de contacto"
        label="Bloquear contacto"
      >
        <input type="hidden" name="id" value={id} />
        <p className={styles.meta}>
          Impide nuevos mensajes y solicitudes entre estas cuentas, incluso
          desde otra publicación.
        </p>
        <CheckField
          name="confirm"
          label="Confirmo que quiero bloquear este contacto."
          required
        />
      </MutationForm>
    </details>
  );
}
export function ReportForm({
  kind,
  id,
}: {
  kind: "profile" | "listing" | "conversation";
  id: string;
}) {
  return (
    <details className={styles.disclosure}>
      <summary>Reportar un problema</summary>
      <MutationForm
        action={reportEntry}
        key={`${kind}:${id}`}
        legend="Reporte privado a moderación"
        label="Enviar reporte"
      >
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <TextAreaField
          name="reason"
          label="Qué ocurrió"
          required
          minLength={10}
          maxLength={1000}
          help={
            kind === "conversation"
              ? "Al reportar autorizás que moderación revise la evidencia necesaria de esta conversación. Evitá agregar información médica o identificatoria innecesaria."
              : "Explicá qué dato o comportamiento debería revisar moderación. El reporte no se publica."
          }
        />
      </MutationForm>
    </details>
  );
}
export function DeleteExchangeAccountForm() {
  return (
    <details className={styles.disclosure}>
      <summary>Solicitar la eliminación de mi cuenta</summary>
      <MutationForm
        action={deleteExchangeAccount}
        legend="Eliminar mi cuenta y sus contenidos"
        label="Solicitar eliminación de mi cuenta"
      >
        <p className={styles.meta}>
          Se retiran tus publicaciones de búsquedas y se solicita la eliminación
          de la cuenta completa, incluidos perfiles, artículos y mensajes. Los
          recursos públicos verificados pueden permanecer con su autoría
          anonimizada. La evidencia mínima de reportes abiertos puede
          conservarse para resolverlos. La solicitud no significa que el proceso
          ya haya terminado.
        </p>
        <TextField
          name="confirmation"
          label="Para confirmar, escribí ELIMINAR MI CUENTA"
          autoComplete="off"
          required
          pattern="ELIMINAR MI CUENTA"
          maxLength={18}
        />
      </MutationForm>
    </details>
  );
}
