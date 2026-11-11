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
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      <fieldset disabled={pending} className={styles.stack}>
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
