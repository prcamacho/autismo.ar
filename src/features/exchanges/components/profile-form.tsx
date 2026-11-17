"use client";

import { saveProfile, enrollAccount } from "../actions";
import { AGE_GROUPS } from "../model";
import type { ProfileRow } from "../db-contract";
import { MutationForm } from "./mutation-form";
import { CheckField, Choices, TextAreaField, TextField } from "./fields";
import styles from "../exchanges.module.css";

export function EnrollmentForm({
  disabled = false,
  enrolled = false,
  notifications = false,
}: {
  disabled?: boolean;
  enrolled?: boolean;
  notifications?: boolean;
}) {
  return (
    <MutationForm
      action={enrollAccount}
      disabled={disabled}
      legend={enrolled ? "Preferencias de contacto" : "Antes de participar"}
      label={enrolled ? "Guardar preferencias" : "Habilitar mi participación"}
    >
      <p className={styles.meta}>
        Las búsquedas y el contacto están disponibles para cuentas de personas
        adultas. No publiques datos identificatorios de menores, domicilios ni
        documentación médica.
      </p>
      <CheckField
        name="adult"
        label="Confirmo que tengo 18 años o más."
        required
        defaultChecked={enrolled}
      />
      <CheckField
        name="notifications"
        label="Quiero recibir avisos agrupados por correo cuando tenga novedades."
        defaultChecked={notifications}
      />
      <p className={styles.meta}>
        Las novedades siempre estarán en tu bandeja. El correo es opcional y no
        incluye el contenido de los mensajes.
      </p>
    </MutationForm>
  );
}

export function ProfileForm({
  profile,
  disabled,
  photosAvailable,
}: {
  profile: ProfileRow | null;
  disabled: boolean;
  photosAvailable: boolean;
}) {
  const data = profile?.data;
  return (
    <MutationForm
      action={saveProfile}
      legend="Tu presentación profesional"
      label="Guardar y enviar a revisión"
      disabled={disabled}
      successHref="/busquedas/perfil"
    >
      <input type="hidden" name="version" value={profile?.version ?? 0} />
      <p className={styles.meta}>
        Los campos marcados como obligatorios son necesarios. Presentá tu
        formación con precisión: un rol de apoyo y un título no son lo mismo.
      </p>
      <TextField
        name="name"
        label="Nombre profesional"
        autoComplete="name"
        required
        minLength={2}
        maxLength={100}
        defaultValue={data?.name}
      />
      <TextField
        name="title"
        label="Título o formación"
        required
        minLength={2}
        maxLength={160}
        defaultValue={data?.title}
      />
      <TextField
        name="institution"
        label="Institución de formación (opcional)"
        maxLength={160}
        defaultValue={data?.institution}
      />
      <div className={styles.columns}>
        <TextField
          name="graduationYear"
          label="Año de egreso (opcional)"
          type="number"
          min={1900}
          max={new Date().getUTCFullYear()}
          inputMode="numeric"
          defaultValue={data?.graduationYear ?? ""}
        />
        <TextField
          name="experienceYears"
          label="Años de experiencia en tu actividad"
          type="number"
          min={0}
          max={80}
          required
          inputMode="numeric"
          defaultValue={data?.experienceYears ?? 0}
        />
      </div>
      <TextField
        name="registration"
        label="Matrícula o registro, si corresponde"
        maxLength={120}
        defaultValue={data?.registration}
        help="Indicá también la jurisdicción. No todas las funciones tienen matrícula; completar este campo no implica que haya sido verificado."
      />
      <Choices
        name="ageGroups"
        legend="Etapas de vida con las que trabajás"
        options={AGE_GROUPS}
        selected={data?.ageGroups}
      />
      <TextAreaField
        name="description"
        label="Presentación"
        required
        minLength={20}
        maxLength={1500}
        defaultValue={data?.description}
        help="Contá sobre tu trabajo sin publicar datos de personas atendidas, teléfonos ni correos. Tu experiencia y formación se muestran como información declarada."
      />
      {photosAvailable ? (
        <TextField
          name="photo"
          label="Foto de perfil (opcional)"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          help="Una imagen JPEG, PNG o WebP de hasta 2 MB. Se reducirá y se quitarán sus metadatos. No modifica tu posición en los resultados."
        />
      ) : (
        <p className={styles.notice}>
          La carga de fotos todavía no está habilitada en este entorno. Podés
          presentar tu perfil sin foto.
        </p>
      )}
      {data?.photoPath && (
        <CheckField name="removePhoto" label="Quitar mi foto actual." />
      )}
      <CheckField
        name="isPublic"
        label="Quiero que mi perfil profesional sea público cuando se apruebe."
        defaultChecked={profile?.is_public ?? false}
      />
      <p className={styles.meta}>
        Para ofrecer servicios públicamente necesitás un perfil público
        revisado. Tus datos de acceso permanecen privados. Los cambios en la
        presentación pasan nuevamente por revisión.
      </p>
    </MutationForm>
  );
}
