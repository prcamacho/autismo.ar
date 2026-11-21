"use client";

import { useId, useState } from "react";
import { ServicePicker } from "@/features/services/service-picker";
import {
  serviceRoles,
  ENGAGEMENTS,
  COVERAGES,
  type Service,
} from "@/features/services/model";
import type { ListingData } from "../model";
import type { Place } from "@/features/locations/model";
import { saveListing } from "../actions";
import {
  AGE_GROUPS,
  AVAILABILITY,
  DAYS,
  MODALITIES,
  SHIFTS,
  type ListingKind,
} from "../model";
import type { ListingView } from "../db-contract";
import { MutationForm } from "./mutation-form";
import {
  CheckField,
  Choices,
  RadioChoices,
  TextAreaField,
  TextField,
} from "./fields";
import { LocationPicker } from "./location-picker";
import styles from "../exchanges.module.css";

export function ListingForm({
  kind,
  listing,
  initialPlaces,
  disabled,
  nonce,
  services,
  draft,
}: {
  kind: ListingKind;
  listing?: ListingView;
  initialPlaces: Place[];
  disabled: boolean;
  nonce: string;
  services: Service[];
  draft?: Partial<ListingData>;
}) {
  const id = useId();
  const data = listing?.data ?? draft;
  const [serviceId, setServiceId] = useState(
    services.some((s) => s.id === data?.service) ? (data?.service ?? "") : "",
  );
  const selectedService = services.find((s) => s.id === serviceId);
  const roles = serviceRoles(selectedService);
  const offering = kind === "offer";
  return (
    <MutationForm
      action={saveListing}
      disabled={disabled}
      legend={offering ? "Tu disponibilidad" : "Qué apoyo estás buscando"}
      label={listing ? "Guardar cambios" : "Enviar publicación a revisión"}
      successHref="/busquedas/:id"
      initialNonce={nonce}
      redirectOnSuccess={!listing}
    >
      <input type="hidden" name="id" value={listing?.id ?? ""} />
      <input type="hidden" name="version" value={listing?.version ?? 0} />
      <input type="hidden" name="kind" value={kind} />
      <p className={styles.notice}>
        {offering
          ? "Publicá las zonas donde aceptás trabajar. No hace falta indicar dónde vivís."
          : "Tu búsqueda será visible para cuentas registradas. No incluyas nombres de menores, diagnósticos, escuela concreta ni domicilio."}
      </p>
      <p className={styles.meta}>
        El título se arma con el servicio, la ubicación y la modalidad que
        elijas.
      </p>
      {data?.service && !services.some((s) => s.id === data.service) && (
        <p className={styles.notice}>
          La clasificación anterior necesita actualizarse. Elegí el servicio
          específico para guardar los cambios.
        </p>
      )}
      <ServicePicker
        services={services}
        value={serviceId}
        onChange={setServiceId}
        requestLink={false}
      />
      <details className={styles.disclosure}>
        <summary>No encuentro lo que necesito</summary>
        <div className={styles.stack}>
          <p>
            Pedí que incorporemos una opción. Guardaremos los datos de este
            formulario como borrador privado junto con tu solicitud.
          </p>
          <TextField
            name="requestedName"
            label="Nombre de la opción que falta"
            maxLength={100}
          />
          <TextAreaField
            name="reason"
            label="Por qué necesitás esta opción"
            maxLength={1000}
            help="No incluyas nombres de menores, diagnósticos, domicilios ni datos de contacto."
          />
          <TextField
            name="source"
            label="Fuente pública (opcional)"
            type="url"
            maxLength={1000}
          />
          <input type="hidden" name="withDraft" value="on" />
          <button
            type="submit"
            name="intent"
            value="catalog-request"
            formNoValidate
            disabled={disabled}
            className="button button-secondary"
          >
            Guardar borrador y pedir opción
          </button>
        </div>
      </details>
      <div className={styles.field}>
        <label htmlFor={`${id}-role`}>Rol (obligatorio)</label>
        <select
          key={serviceId}
          id={`${id}-role`}
          name="role"
          required
          defaultValue={
            roles.includes(data?.role ?? "")
              ? data?.role
              : roles.length === 1
                ? roles[0]
                : ""
          }
        >
          <option value="">
            {serviceId ? "Elegí un rol" : "Elegí primero un servicio"}
          </option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      {serviceId === "inclusion-escolar" && (
        <p className={styles.meta}>
          MAI, AIE y acompañamiento terapéutico tienen funciones diferentes. Las
          denominaciones y requisitos dependen de la jurisdicción.
        </p>
      )}
      <TextAreaField
        name="description"
        label="Aclaraciones (opcional)"
        maxLength={1500}
        defaultValue={data?.description}
        help="Usá el contacto privado para conversar. No publiques teléfonos, correos ni documentación personal o médica."
      />
      <fieldset className={styles.fieldset}>
        <legend>
          {offering
            ? "Dónde ofrecés tus servicios"
            : "Dónde necesitás el servicio"}
        </legend>
        <LocationPicker initialPlaces={initialPlaces} />
      </fieldset>
      <RadioChoices
        name="modality"
        legend="Modalidad"
        options={MODALITIES}
        value={data?.modality ?? "presencial"}
      />
      <Choices
        name="days"
        legend="Días (elegí al menos uno)"
        options={DAYS}
        selected={data?.days}
      />
      <Choices
        name="shifts"
        legend="Turnos (elegí al menos uno)"
        options={SHIFTS}
        selected={data?.shifts}
      />
      <TextField
        name="startDate"
        label="Fecha de inicio estimada (opcional)"
        type="date"
        defaultValue={data?.startDate}
      />
      <RadioChoices
        name="availability"
        legend={offering ? "Disponibilidad actual" : "Estado de la necesidad"}
        options={AVAILABILITY}
        value={data?.availability ?? "available"}
      />
      <Choices
        name="ageGroups"
        legend={offering ? "Etapas de vida" : "Etapa de vida, si es pertinente"}
        options={AGE_GROUPS}
        selected={data?.ageGroups}
      />
      <div className={styles.field}>
        <label htmlFor={`${id}-engagement`}>Contratación (opcional)</label>
        <select
          id={`${id}-engagement`}
          name="engagement"
          defaultValue={
            ENGAGEMENTS.some((x) => x === data?.engagement)
              ? data?.engagement
              : ""
          }
        >
          {ENGAGEMENTS.map((value) => (
            <option key={value} value={value}>
              {value || "Sin informar"}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-coverage`}>Cobertura (opcional)</label>
        <select
          id={`${id}-coverage`}
          name="coverage"
          defaultValue={data?.coverage ?? ""}
        >
          {COVERAGES.map((value) => (
            <option key={value} value={value}>
              {value || "Sin informar"}
            </option>
          ))}
        </select>
        <p className={styles.meta}>
          Es información declarada. Confirmá los requisitos con la otra persona.
        </p>
      </div>
      <CheckField
        name="receiveRequests"
        label="Acepto recibir solicitudes de contacto vinculadas a esta publicación."
        defaultChecked={data?.receiveRequests ?? true}
      />
      <p className={styles.meta}>
        {offering
          ? "La disponibilidad vence a los 60 días sin reconfirmación."
          : "La búsqueda se pausa a los 30 días si no la renovás."}{" "}
        Podés pausarla o cerrarla antes. Los cambios de contenido pasan por
        revisión; los cambios de días, turnos o disponibilidad no requieren
        rehacer la presentación.
      </p>
    </MutationForm>
  );
}
