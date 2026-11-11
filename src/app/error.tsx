"use client";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div className="container section">
      <div className="panel" role="alert">
        <h1>No pudimos completar esta operación</h1>
        <p>
          Puede ser una interrupción temporal. Volvé a intentar; no tomes esta
          pantalla como una confirmación de envío.
        </p>
        <button type="button" className="button" onClick={retry}>
          Volver a intentar
        </button>
      </div>
    </div>
  );
}
