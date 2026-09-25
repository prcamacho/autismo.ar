"use client";

import { useActionState, startTransition, type ReactNode } from "react";
import Link from "next/link";
import type { ActionResult } from "./model";
import styles from "./community.module.css";

export function ActionForm({
  action,
  children,
  label,
  resultLink = false,
}: {
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>;
  children: ReactNode;
  label: string;
  resultLink?: boolean;
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
        {state.ok && state.id && resultLink && (
          <Link href={`/comunidad/aportes/${state.id}`} className="text-link">
            Ver el estado del aporte
          </Link>
        )}
      </div>
    </form>
  );
}
