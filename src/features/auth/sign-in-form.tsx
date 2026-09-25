"use client";
import { useState } from "react";
import { ActionForm } from "@/features/community/action-form";
import { requestCode, verifyCode } from "./actions";
import styles from "@/features/community/community.module.css";

export function SignInForm() {
  const [email, setEmail] = useState("");
  return (
    <div className={styles.stack}>
      <ActionForm action={requestCode} label="Recibir un código">
        <div className="form-field">
          <label htmlFor="email">Tu correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={styles.meta}>
            Se usa para ingresar. No se muestra en tus aportes.
          </p>
        </div>
        <div className={styles.hidden} aria-hidden="true">
          <label htmlFor="website">Dejá este campo vacío</label>
          <input name="website" id="website" tabIndex={-1} autoComplete="off" />
        </div>
      </ActionForm>
      <div className={styles.section}>
        <h3>Ya tengo el código</h3>
        <ActionForm action={verifyCode} label="Ingresar a mi cuenta">
          <div className="form-field">
            <label htmlFor="verify-email">Correo al que llegó el código</label>
            <input
              id="verify-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="token">Código del correo</label>
            <input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              required
            />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
