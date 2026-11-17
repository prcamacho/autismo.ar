"use client";

import { useActionState, startTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/result";
import styles from "./ui.module.css";

export function ActionForm({
  action,
  children,
  label,
}: {
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>;
  children: ReactNode;
  label: string;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  return (
    <form
      className={styles.form}
      action={dispatch}
      aria-label={label}
      onSubmit={(event) => {
        // Keep the entered values after expected validation/network failures.
        // The native action remains available before JavaScript hydrates.
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => dispatch(form));
      }}
    >
      <fieldset disabled={pending} className={styles.stack}>
        <legend className="sr-only">{label}</legend>
        {children}
        <div>
          <button className="button" type="submit">
            {pending ? "Guardando…" : label}
          </button>
        </div>
      </fieldset>
      <div aria-live="polite">
        {state.message && (
          <p className={styles.feedback} data-ok={Boolean(state.ok)}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
