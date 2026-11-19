"use client";
import { useState } from "react";
import { MutationForm } from "@/features/exchanges/components/mutation-form";
import {
  TextField,
  TextAreaField,
} from "@/features/exchanges/components/fields";
import { requestService, reviewService } from "./actions";
import { ServicePicker } from "./service-picker";
import { SERVICE_GROUPS, type Service, type CatalogRequest } from "./model";
import styles from "@/features/exchanges/exchanges.module.css";

export function CatalogRequestForm({
  disabled,
  nonce,
}: {
  disabled: boolean;
  nonce: string;
}) {
  return (
    <MutationForm
      action={requestService}
      legend="Pedir una opción"
      label="Enviar solicitud"
      disabled={disabled}
      initialNonce={nonce}
      successHref="/catalogo/solicitudes"
      redirectOnSuccess
    >
      <TextField
        name="requestedName"
        label="¿Cómo se llama lo que necesitás?"
        required
        minLength={2}
        maxLength={100}
      />
      <TextAreaField
        name="reason"
        label="¿Por qué necesitás esta opción?"
        required
        minLength={10}
        maxLength={1000}
        help="Describí el servicio. No incluyas información personal ni documentación médica."
      />
      <TextField
        name="source"
        label="Fuente pública (opcional)"
        type="url"
        maxLength={1000}
      />
      <p className={styles.meta}>
        Revisaremos si ya existe con otro nombre o si corresponde incorporarlo.
        La respuesta se consulta en Mis solicitudes; no enviamos avisos por
        correo.
      </p>
    </MutationForm>
  );
}
export function CatalogReviewForm({
  request,
  services,
}: {
  request: CatalogRequest;
  services: Service[];
}) {
  const [decision, setDecision] = useState("existing");
  const [service, setService] = useState("");
  return (
    <MutationForm
      action={reviewService}
      legend="Resolver solicitud"
      label="Guardar revisión"
    >
      <input name="id" value={request.id} type="hidden" />
      <div className={styles.field}>
        <label htmlFor={`${request.id}-decision`}>Decisión</label>
        <select
          id={`${request.id}-decision`}
          name="decision"
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
        >
          <option value="existing">Indicar una opción existente</option>
          <option value="alias">Agregar este nombre como sinónimo</option>
          <option value="new">Incorporar un servicio</option>
          <option value="rejected">No incorporar</option>
        </select>
      </div>
      {["existing", "alias"].includes(decision) && (
        <ServicePicker
          services={services}
          value={service}
          onChange={setService}
          requestLink={false}
        />
      )}
      {decision === "new" && (
        <>
          <TextField
            name="name"
            label="Nombre normalizado"
            defaultValue={request.requested_name}
            required
            minLength={2}
            maxLength={100}
          />
          <div className={styles.field}>
            <label htmlFor={`${request.id}-group`}>Grupo</label>
            <select id={`${request.id}-group`} name="group">
              {SERVICE_GROUPS.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </div>
          <TextField
            name="source"
            label="Fuente del servicio"
            type="url"
            required
            defaultValue={request.source_url}
            maxLength={1000}
          />
        </>
      )}
      {decision !== "new" && (
        <input type="hidden" name="group" value={SERVICE_GROUPS[0]} />
      )}
      <TextAreaField
        name="note"
        label="Respuesta para quien lo pidió"
        required
        minLength={10}
        maxLength={1000}
      />
      <p className={styles.meta}>
        La incorporación clasifica un servicio; no acredita profesionales ni
        asigna cobertura del nomenclador.
      </p>
    </MutationForm>
  );
}
