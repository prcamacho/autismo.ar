"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ActionResult } from "@/lib/result";
import styles from "../exchanges.module.css";

type Mutation = (
  previous: ActionResult,
  form: FormData,
) => Promise<ActionResult>;

/** Keeps entered text on validation/transport failures; native actions remain a fallback. */
export function MutationForm({
  action,
  children,
  label,
  disabled = false,
  legend,
  successHref,
  initialNonce,
  resetOnSuccess = false,
  redirectOnSuccess = false,
}: {
  action: Mutation;
  children: ReactNode;
  label: string;
  disabled?: boolean;
  legend: string;
  successHref?: string;
  initialNonce?: string;
  resetOnSuccess?: boolean;
  redirectOnSuccess?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef(initialNonce);
  const headingId = useId();
  const [state, dispatch, pending] = useActionState(action, {});
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      formRef.current
        ?.querySelectorAll<HTMLInputElement>('input[type="file"]')
        .forEach((input) => {
          input.value = "";
        });
      if (
        redirectOnSuccess &&
        successHref &&
        (!successHref.includes(":id") || state.id)
      ) {
        router.push(successHref.replace(":id", state.id ?? ""));
        return;
      }
      if (resetOnSuccess) formRef.current?.reset();
      if (nonceRef.current) nonceRef.current = crypto.randomUUID();
      router.refresh();
    } else feedbackRef.current?.focus();
  }, [state, resetOnSuccess, redirectOnSuccess, successHref, router]);
  return (
    <form
      ref={formRef}
      className={styles.form}
      action={dispatch}
      aria-labelledby={headingId}
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || pending) return;
        const data = new FormData(event.currentTarget);
        if (nonceRef.current) data.set("nonce", nonceRef.current);
        startTransition(() => dispatch(data));
      }}
    >
      {initialNonce && (
        <input type="hidden" name="nonce" value={initialNonce} />
      )}
      <fieldset className={styles.fieldset} disabled={pending}>
        <legend id={headingId}>{legend}</legend>
        <div className={styles.stack}>
          {children}
          <div>
            <button className="button" type="submit" disabled={disabled}>
              {pending ? "Guardando…" : label}
            </button>
          </div>
        </div>
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {state.message && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className={styles.feedback}
            data-ok={Boolean(state.ok)}
          >
            <p>{state.message}</p>
            {state.ok && successHref && (
              <Link
                href={successHref.replace(":id", state.id ?? "")}
                className="text-link"
              >
                Continuar →
              </Link>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
