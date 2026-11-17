import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { readPage } from "@/lib/pagination";
import {
  getConversation,
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
import {
  BlockContactForm,
  MessageForm,
  ReportForm,
  RespondContactForm,
} from "@/features/exchanges/components/contact-forms";
import { formatInstant } from "@/features/exchanges/components/labels";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Conversación privada",
};
export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { id } = await params;
  const page = readPage((await searchParams).pagina);
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getConversation(id, page),
  ]);
  const record = result.data;
  const conversation = record?.conversation;
  return (
    <ExchangePage
      title="Conversación privada."
      description="Compartí solo lo necesario. Estos mensajes tienen acceso restringido; no son un canal de atención de emergencias."
      current="/mensajes"
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <ParticipationNotice context={context} />
          <ExchangeNotice
            status={result.status === context.status ? "ready" : result.status}
          />
          {conversation && record && context.viewer ? (
            <>
              <div className={styles.actions}>
                <Status
                  value={record.blocked ? "blocked" : conversation.status}
                />
                <Link
                  className="button button-secondary"
                  href={`/mensajes/${id}`}
                >
                  Actualizar conversación
                </Link>
                {conversation.listing_id && (
                  <Link
                    className="text-link"
                    href={`/busquedas/${conversation.listing_id}`}
                  >
                    Ver publicación relacionada
                  </Link>
                )}
              </div>
              <p className={styles.meta}>
                {page === 1
                  ? "Mensajes más recientes, ordenados del primero al último."
                  : "Mensajes anteriores, ordenados del primero al último. Volvé a la página 1 para ver los más recientes."}
              </p>
              {conversation.deletion_warning_at && (
                <p className={styles.notice}>
                  Esta conversación está próxima a eliminarse por inactividad.
                  Podés continuarla si todavía necesitás este contacto.
                </p>
              )}
              <ol className={styles.messages} role="list">
                {record.messages
                  .slice(0, EXCHANGE_LIMITS.pageSize)
                  .reverse()
                  .map((message) => (
                    <li
                      key={message.id}
                      className={styles.message}
                      data-own={message.sender_id === context.viewer?.id}
                    >
                      <span className={styles.meta}>
                        {message.sender_id === context.viewer?.id
                          ? "Vos"
                          : "La otra persona"}{" "}
                        ·{" "}
                        <time dateTime={message.created_at}>
                          {formatInstant(message.created_at)}
                        </time>
                      </span>
                      <p>{message.body}</p>
                    </li>
                  ))}
              </ol>
              <Pagination
                page={page}
                hasMore={record.messages.length > EXCHANGE_LIMITS.pageSize}
                href={`/mensajes/${id}`}
              />
              {record.blocked ? (
                <p className={styles.notice}>
                  El contacto está bloqueado. No se pueden enviar nuevos
                  mensajes ni solicitudes entre estas cuentas.
                </p>
              ) : conversation.status === "pending" ? (
                conversation.recipient_id === context.viewer.id ? (
                  <div className={styles.card}>
                    <RespondContactForm id={id} />
                  </div>
                ) : (
                  <p className={styles.notice}>
                    Tu solicitud espera una respuesta. Podrás escribir cuando la
                    otra persona la acepte.
                  </p>
                )
              ) : conversation.status === "accepted" ? (
                page === 1 ? (
                  <div className={styles.card}>
                    <MessageForm conversationId={id} nonce={randomUUID()} />
                  </div>
                ) : (
                  <Link href={`/mensajes/${id}`} className="button">
                    Ir a los mensajes recientes para responder
                  </Link>
                )
              ) : (
                <p className={styles.notice}>
                  La solicitud fue rechazada. Esta conversación no admite nuevos
                  mensajes.
                </p>
              )}
              <ReportForm kind="conversation" id={id} />
              {!record.blocked && <BlockContactForm id={id} />}
            </>
          ) : (
            context.viewer &&
            result.status === "ready" && (
              <EmptyPanel title="Esta conversación no está disponible">
                <p>Puede haberse eliminado o pertenecer a otra cuenta.</p>
                <Link href="/mensajes" className="text-link">
                  Volver a mis mensajes →
                </Link>
              </EmptyPanel>
            )
          )}
        </div>
      </div>
    </ExchangePage>
  );
}
