"use client";

import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import styles from "../exchanges.module.css";
import { choiceLabel } from "./labels";

export function TextField({
  label,
  help,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {input.required ? " (obligatorio)" : ""}
      </label>
      {help && (
        <p id={`${id}-help`} className={styles.meta}>
          {help}
        </p>
      )}
      <input
        {...input}
        id={id}
        aria-describedby={help ? `${id}-help` : undefined}
      />
    </div>
  );
}
export function TextAreaField({
  label,
  help,
  ...input
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  help?: string;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {input.required ? " (obligatorio)" : ""}
      </label>
      {help && (
        <p id={`${id}-help`} className={styles.meta}>
          {help}
        </p>
      )}
      <textarea
        {...input}
        id={id}
        aria-describedby={help ? `${id}-help` : undefined}
      />
    </div>
  );
}
export function CheckField({
  label,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <div className={styles.choice}>
      <input {...input} type="checkbox" id={id} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
export function Choices({
  name,
  legend,
  options,
  selected = [],
}: {
  name: string;
  legend: string;
  options: readonly string[];
  selected?: string[];
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{legend}</legend>
      <div className={styles.choices}>
        {options.map((value) => (
          <CheckField
            key={value}
            name={name}
            value={value}
            label={choiceLabel(value)}
            defaultChecked={selected.includes(value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
export function RadioChoices({
  name,
  legend,
  options,
  value,
}: {
  name: string;
  legend: string;
  options: Record<string, string>;
  value: string;
}) {
  const id = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend>{legend}</legend>
      <div className={styles.choices}>
        {Object.entries(options).map(([key, label]) => (
          <div key={key} className={styles.choice}>
            <input
              id={`${id}-${key}`}
              type="radio"
              name={name}
              value={key}
              defaultChecked={value === key}
              required
            />
            <label htmlFor={`${id}-${key}`}>{label}</label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
