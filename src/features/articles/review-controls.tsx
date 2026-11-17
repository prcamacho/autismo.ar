import { ActionForm } from "@/components/action-form";
import { reviewArticle, reviewCafecito } from "./actions";

export function ReviewControls({
  id,
  revision,
  kind,
}: {
  id: string;
  revision: number;
  kind: "article" | "cafecito";
}) {
  const prefix = `${kind}-${id}`;
  return (
    <ActionForm
      action={kind === "article" ? reviewArticle : reviewCafecito}
      label="Registrar decisión"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={revision} />
      <fieldset>
        <legend>Decisión</legend>
        <div>
          <input
            type="radio"
            id={`${prefix}-approve`}
            name="decision"
            value="approved"
            required
          />
          <label htmlFor={`${prefix}-approve`}>Aprobar</label>
        </div>
        <div>
          <input
            type="radio"
            id={`${prefix}-reject`}
            name="decision"
            value="rejected"
            required
          />
          <label htmlFor={`${prefix}-reject`}>Solicitar cambios</label>
        </div>
      </fieldset>
      <div className="form-field">
        <label htmlFor={`${prefix}-note`}>
          Motivo de la decisión (obligatorio)
        </label>
        <textarea
          id={`${prefix}-note`}
          name="note"
          minLength={10}
          maxLength={1000}
          rows={3}
          required
        />
      </div>
    </ActionForm>
  );
}
