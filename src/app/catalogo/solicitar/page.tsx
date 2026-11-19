import { randomUUID } from "node:crypto";
import { getExchangeContext } from "@/features/exchanges/repository";
import {
  ExchangePage,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { CatalogRequestForm } from "@/features/services/request-forms";
import styles from "@/features/exchanges/exchanges.module.css";
export const metadata = {
  ...privateMetadata,
  title: "Pedir una opción al catálogo",
};
export default async function Page() {
  const context = await getExchangeContext();
  return (
    <ExchangePage
      title="¿Falta una opción?"
      description="Pedí que revisemos un servicio o un nombre que todavía no encontrás."
    >
      <div className={styles.narrow}>
        <ParticipationNotice context={context} />
        <div className={styles.card}>
          <CatalogRequestForm
            nonce={randomUUID()}
            disabled={context.status !== "ready" || !context.account}
          />
        </div>
      </div>
    </ExchangePage>
  );
}
