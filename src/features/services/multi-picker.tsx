"use client";
import { useState } from "react";
import { ServicePicker } from "./service-picker";
import type { Service } from "./model";
import styles from "./multi-picker.module.css";
export function ServiceMultiPicker({
  services,
  initial = [],
  required = false,
}: {
  services: Service[];
  initial?: string[];
  required?: boolean;
}) {
  const [ids, setIds] = useState(
    initial.filter((id) => services.some((s) => s.id === id)),
  );
  return (
    <fieldset>
      <legend>
        Servicios del catálogo
        {required ? " (elegí al menos uno)" : " (opcional)"}
      </legend>
      <div className="chips">
        {ids.map((id) => (
          <span className="chip" key={id}>
            {services.find((s) => s.id === id)?.name}
            <input type="hidden" name="serviceIds" value={id} />
            <button
              type="button"
              className={styles.remove}
              aria-label={`Quitar ${services.find((s) => s.id === id)?.name}`}
              onClick={() => setIds(ids.filter((x) => x !== id))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <ServicePicker
        key={ids.join(",")}
        services={services.filter((s) => !ids.includes(s.id))}
        value=""
        onChange={(id) => {
          if (id && ids.length < 33) setIds([...ids, id]);
        }}
        name="add-service"
        label="Agregar servicio"
        required={required && ids.length === 0}
      />
    </fieldset>
  );
}
