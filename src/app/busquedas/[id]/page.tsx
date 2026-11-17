import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  getExchangeContext,
  getListing,
} from "@/features/exchanges/repository";
import {
  AVAILABILITY,
  MODALITIES,
  serviceName,
} from "@/features/exchanges/model";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  LocationList,
  ProfileSummary,
  Status,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { choiceLabel } from "@/features/exchanges/components/labels";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import {
  ReportForm,
  RequestContactForm,
} from "@/features/exchanges/components/contact-forms";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = { ...privateMetadata, title: "Publicación" };
export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getListing(id),
  ]);
  const listing = result.data;
  if (!listing)
    return (
      <ExchangePage
        title="Publicación."
        description="Consultá disponibilidad y búsquedas en tu zona."
      >
        <ExchangeNotice status={result.status} />
        {result.status === "ready" && (
          <EmptyPanel title="Esta publicación no está disponible">
            <p>Puede haberse retirado o requerir una cuenta para verla.</p>
            <Link href="/busquedas" className="text-link">
              Explorar publicaciones →
            </Link>
          </EmptyPanel>
        )}
        {!context.viewer && context.status === "ready" && (
          <ParticipationNotice context={context} />
        )}
      </ExchangePage>
    );
  const active =
    listing.status === "published" &&
    listing.expires_at &&
    listing.data.availability !== "unavailable";
  return (
    <ExchangePage
      title={listing.data.title}
      description={
        listing.kind === "offer"
          ? "Disponibilidad declarada por el profesional."
          : "Búsqueda visible para cuentas registradas."
      }
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <article className={styles.card}>
            <div className={styles.actions}>
              <span className={styles.tag}>
                {listing.kind === "offer"
                  ? "Ofrece servicios"
                  : "Busca profesional"}
              </span>
              <Status value={listing.status} />
              {!active && listing.status === "published" && (
                <span className={styles.tag}>Sin solicitudes nuevas</span>
              )}
            </div>
            {listing.profile && (
              <ProfileSummary
                id={listing.profile.id}
                data={listing.profile.data}
              />
            )}
            <h2>{serviceName(listing.data.service)}</h2>
            <p className={styles.prose}>{listing.data.description}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Rol</dt>
                <dd>{listing.data.role}</dd>
              </div>
              <div>
                <dt>Modalidad</dt>
                <dd>{MODALITIES[listing.data.modality]}</dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>{AVAILABILITY[listing.data.availability]}</dd>
              </div>
              <div>
                <dt>Días</dt>
                <dd>{listing.data.days.map(choiceLabel).join(", ")}</dd>
              </div>
              <div>
                <dt>Turnos</dt>
                <dd>{listing.data.shifts.map(choiceLabel).join(", ")}</dd>
              </div>
              {listing.data.startDate && (
                <div>
                  <dt>Inicio estimado</dt>
                  <dd>{formatDate(`${listing.data.startDate}T12:00:00Z`)}</dd>
                </div>
              )}
              {listing.data.ageGroups.length > 0 && (
                <div>
                  <dt>Etapas de vida</dt>
                  <dd>{listing.data.ageGroups.join(", ")}</dd>
                </div>
              )}
              {listing.data.engagement && (
                <div>
                  <dt>Contratación</dt>
                  <dd>{listing.data.engagement}</dd>
                </div>
              )}
            </dl>
          <h2>
            {listing.kind === "offer"
              ? "Zonas de trabajo"
              : "Dónde se necesita el servicio"}
          </h2>
            <LocationList ids={listing.data.locationIds} />
            {listing.expires_at && (
              <p className={styles.meta}>
                Vigencia hasta {formatDate(listing.expires_at)}.
              </p>
            )}
            <p className={styles.meta}>
              La información es declarada por quien publica. La revisión de
              privacidad y pertinencia no certifica calidad ni habilitación
              profesional.
            </p>
          </article>
          {listing.owner ? (
            <div className={styles.card}>
              {listing.review_note && (
                <p className={styles.prose}>Revisión: {listing.review_note}</p>
              )}
              <Link href={`/busquedas/${id}/editar`} className="button">
                Editar o administrar publicación
              </Link>
            </div>
          ) : (
            <>
              <ParticipationNotice context={context} />
              {context.account && active && listing.data.receiveRequests && (
                <div className={styles.card}>
                  <RequestContactForm listingId={id} nonce={randomUUID()} />
                </div>
              )}
              {(!active || !listing.data.receiveRequests) && (
                <p className={styles.notice}>
                  Esta publicación no recibe solicitudes nuevas. Si ya tenés una
                  conversación aceptada, podés continuar desde Mensajes.
                </p>
              )}
              {context.account && <ReportForm kind="listing" id={id} />}
            </>
          )}
        </div>
      </div>
    </ExchangePage>
  );
}
