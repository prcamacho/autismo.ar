import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import {
  getConversations,
  getExchangeContext,
} from "@/features/exchanges/repository";
import { EXCHANGE_LIMITS } from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  Status,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { formatInstant } from "@/features/exchanges/components/labels";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = { ...privateMetadata, title: "Mis mensajes" };
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const page = readPage((await searchParams).pagina);
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getConversations(page),
  ]);
  return (
    <ExchangePage
      title="Tus conversaciones."
      description="Las solicitudes y los mensajes se consultan aquí. Tu teléfono y tu correo permanecen ocultos."
      current="/mensajes"
    >
      <ParticipationNotice context={context} />
      {context.viewer && (
        <>
          <div className={styles.actions}>
            <Link href="/mensajes" className="button button-secondary">
              Actualizar bandeja
            </Link>
            <span className={styles.meta}>
              La bandeja se actualiza al abrirla o al usar este enlace.
            </span>
          </div>
          <ExchangeNotice status={result.status} />
          {result.status === "ready" && result.data.length === 0 && (
            <EmptyPanel title="Todavía no hay conversaciones">
              <p>
                Podés iniciar una solicitud desde una publicación activa o
                recibirla en una publicación tuya.
              </p>
              <Link href="/busquedas" className="text-link">
                Explorar publicaciones →
              </Link>
            </EmptyPanel>
          )}
          <ul className={styles.list} role="list">
            {result.data
              .slice(0, EXCHANGE_LIMITS.pageSize)
              .map((conversation) => (
                <li key={conversation.id}>
                  <article className={styles.card}>
                    <div className={styles.actions}>
                      <Status value={conversation.status} />
                      <span className={styles.meta}>
                        {conversation.sender_id === context.viewer?.id
                          ? "Solicitud enviada"
                          : "Solicitud recibida"}
                      </span>
                    </div>
                    <h2>
                      <Link href={`/mensajes/${conversation.id}`}>
                        Conversación del{" "}
                        {formatInstant(conversation.created_at)}
                      </Link>
                    </h2>
                    <p className={styles.meta}>
                      Última actividad: {formatInstant(conversation.updated_at)}
                      .
                    </p>
                    {conversation.deletion_warning_at && (
                      <p className={styles.notice}>
                        Esta conversación está próxima a eliminarse por
                        inactividad.
                      </p>
                    )}
                  </article>
                </li>
              ))}
          </ul>
          <Pagination
            page={page}
            hasMore={result.data.length > EXCHANGE_LIMITS.pageSize}
            href="/mensajes"
          />
          <p className={styles.meta}>
            Las conversaciones se eliminan después de 90 días sin actividad, con
            aviso previo. La evidencia mínima de reportes abiertos se trata por
            separado.
          </p>
        </>
      )}
    </ExchangePage>
  );
}
