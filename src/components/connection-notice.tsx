import type { ConnectionStatus } from "@/lib/result";
import styles from "./ui.module.css";

export function ConnectionNotice({ status }: { status: ConnectionStatus }) {
  if (status === "ready") return null;
  return (
    <div className={styles.callout} role="status">
      <strong>
        {status === "unconfigured"
          ? "La comunidad está en preparación"
          : "No pudimos cargar la información"}
      </strong>
      <p>
        {status === "unconfigured"
          ? "Estamos habilitando las cuentas y la recepción de aportes. Mientras tanto podés explorar el sitio y preparar un borrador en tu dispositivo."
          : "Puede ser una interrupción temporal. Volvé a intentar en unos minutos; tus aportes guardados no se reemplazan por esta pantalla."}
      </p>
    </div>
  );
}
