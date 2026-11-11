import { categories } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geography";
import { ageGroups, type ResourceInput } from "@/features/resources/validation";
import { DuplicateFinder } from "./duplicate-finder";
import styles from "@/components/ui.module.css";

export function ContributionFields({
  defaults,
  resourceId,
  name,
  onNameChange,
  scope,
  onScopeChange,
  sourceUrl,
  note,
}: {
  defaults: Partial<ResourceInput>;
  resourceId: string;
  name: string;
  onNameChange: (value: string) => void;
  scope: ResourceInput["scope"];
  onScopeChange: (value: ResourceInput["scope"]) => void;
  sourceUrl: string;
  note: string;
}) {
  return (
    <>
      <div className="form-field">
        <label htmlFor="name">Nombre del recurso *</label>
        <input
          id="name"
          name="name"
          minLength={3}
          maxLength={160}
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nombre del lugar, profesional o servicio"
        />
      </div>
      {!resourceId && <DuplicateFinder name={name} />}
      <fieldset>
        <legend>¿Qué tipo de recurso es? *</legend>
        <div className={styles.choices}>
          {categories.map((c) => (
            <label className={styles.choice} key={c.id}>
              <input
                name="categoryIds"
                type="checkbox"
                value={c.id}
                defaultChecked={defaults.categoryIds?.includes(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-field">
        <label htmlFor="description">Qué ofrece *</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          minLength={30}
          maxLength={2000}
          required
          defaultValue={defaults.description}
          placeholder="Servicios y modalidades que se pueden comprobar en una fuente. Evitá valoraciones personales."
        />
      </div>
      <fieldset className={styles.section}>
        <legend>Ubicación y alcance</legend>
        <div className="form-field">
          <label htmlFor="scope">¿A quiénes alcanza? *</label>
          <select
            id="scope"
            name="scope"
            value={scope}
            onChange={(e) =>
              onScopeChange(e.target.value as ResourceInput["scope"])
            }
          >
            <option value="national">Todo el país</option>
            <option value="province">Una provincia</option>
            <option value="local">Una localidad</option>
          </select>
        </div>
        {scope !== "national" && (
          <div className="form-field">
            <label htmlFor="province">Provincia *</label>
            <select
              id="province"
              name="province"
              required
              defaultValue={defaults.province || ""}
            >
              <option value="">Elegí una provincia</option>
              {PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {scope === "local" && (
          <div className="form-field">
            <label htmlFor="locality">Localidad *</label>
            <input
              id="locality"
              name="locality"
              required
              minLength={2}
              maxLength={120}
              defaultValue={defaults.locality}
            />
            <p className={styles.meta}>
              Compartí la localidad del recurso. No incluyas domicilios
              familiares.
            </p>
          </div>
        )}
      </fieldset>
      <fieldset className={styles.section}>
        <legend>Datos que ayudan a decidir</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="website-resource">Sitio o perfil público</label>
            <input
              id="website-resource"
              name="website"
              type="url"
              maxLength={1000}
              defaultValue={defaults.website}
              placeholder="https://"
            />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Teléfono público del recurso</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={80}
              defaultValue={defaults.phone}
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="hours">Horarios o modalidad de atención</label>
          <input
            id="hours"
            name="hours"
            maxLength={300}
            defaultValue={defaults.hours}
          />
        </div>
        <div className="form-field">
          <label htmlFor="coverage">Obras sociales o cobertura informada</label>
          <input
            id="coverage"
            name="coverage"
            maxLength={400}
            defaultValue={defaults.coverage}
          />
          <p className={styles.meta}>
            Incluí solo lo que la fuente informa. La cobertura y los turnos
            pueden cambiar.
          </p>
        </div>
        <fieldset>
          <legend>Edades atendidas, si están informadas</legend>
          <div className={styles.choices}>
            {ageGroups.map((age) => (
              <label key={age} className={styles.choice}>
                <input
                  name="ageGroups"
                  type="checkbox"
                  value={age}
                  defaultChecked={defaults.ageGroups?.includes(age)}
                />
                {age}
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>
      <fieldset className={styles.section}>
        <legend>Fuente y contexto</legend>
        <div className="form-field">
          <label htmlFor="sourceUrl">Enlace a la fuente *</label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            maxLength={1000}
            required
            defaultValue={sourceUrl}
            placeholder="https://"
          />
          <p className={styles.meta}>
            Página oficial, publicación del recurso u otra fuente pública que
            permita revisar el dato.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="note">Qué comprobaste o qué querés corregir *</label>
          <textarea
            id="note"
            name="note"
            minLength={10}
            maxLength={1000}
            rows={3}
            required
            defaultValue={note}
          />
          <p className={styles.meta}>
            Si tenés relación con el recurso, aclaralo acá. Este contexto
            acompaña la revisión; no es una reseña.
          </p>
        </div>
        <label className={styles.choice}>
          <input name="consent" type="checkbox" required />
          Confirmo que puedo compartir esta información pública del recurso. No
          incluye datos de menores, historias clínicas ni contactos privados.
        </label>
      </fieldset>
    </>
  );
}
