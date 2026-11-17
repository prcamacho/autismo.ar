"use client";

import { useId } from "react";
import type { Place } from "@/features/locations/model";
import { saveListing } from "../actions";
import {
  AGE_GROUPS,
  AVAILABILITY,
  DAYS,
  MODALITIES,
  SERVICES,
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
}: {
  kind: ListingKind;
  listing?: ListingView;
  initialPlaces: Place[];
  disabled: boolean;
  nonce: string;
}) {
  const id = useId();
  const data = listing?.data;
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
      <TextField
        name="title"
        label="Título de la publicación"
        required
        minLength={5}
        maxLength={120}
        defaultValue={data?.title}
      />
      <div className={styles.field}>
        <label htmlFor={`${id}-service`}>Servicio (obligatorio)</label>
        <select
          id={`${id}-service`}
          name="service"
          required
          defaultValue={data?.service ?? ""}
        >
          <option value="">Elegí un servicio</option>
          {SERVICES.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <TextField
        name="role"
        label={offering ? "Rol que ofrecés" : "Rol o apoyo que buscás"}
        required
        minLength={2}
        maxLength={120}
        defaultValue={data?.role}
        help="Las denominaciones pueden variar por jurisdicción. MAI, AIE y acompañamiento terapéutico tienen funciones diferentes. Si no conocés el nombre del rol, describí el apoyo."
      />
      <TextAreaField
        name="description"
        label={offering ? "Sobre este servicio" : "Descripción de la búsqueda"}
        required
        minLength={20}
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
      <TextField
        name="engagement"
        label="Modalidad de contratación o cobertura (opcional)"
        maxLength={200}
        defaultValue={data?.engagement}
        help="Por ejemplo, si trabajás de forma particular o a través de una institución. No adjuntes credenciales ni documentación."
      />
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
