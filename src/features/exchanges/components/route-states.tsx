"use client";

import Link from "next/link";
import styles from "../exchanges.module.css";

export function ExchangeLoading() {
  return (
    <div className={`container ${styles.loading}`} role="status">
      <p>Cargando búsquedas y contacto…</p>
    </div>
  );
}
export function ExchangeError({ reset }: { reset: () => void }) {
  return (
    <div className="container section-small">
      <div className={styles.card}>
        <h1>No pudimos completar esta pantalla.</h1>
        <p>
          Volvé a intentar. Si estabas guardando información, comprobá su estado
          antes de repetir el envío.
        </p>
        <div className={styles.actions}>
          <button type="button" className="button" onClick={reset}>
            Reintentar
          </button>
          <Link href="/busquedas" className="text-link">
            Volver a las publicaciones →
          </Link>
        </div>
      </div>
    </div>
  );
}
