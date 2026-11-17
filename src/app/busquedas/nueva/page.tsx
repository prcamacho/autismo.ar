import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import {
  getExchangeContext,
  getOwnProfile,
} from "@/features/exchanges/repository";
import {
  ExchangeNotice,
  ExchangePage,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { ListingForm } from "@/features/exchanges/components/listing-form";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Nueva publicación",
};
export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const kind = (await searchParams).tipo === "offer" ? "offer" : "request";
  const [context, profile] = await Promise.all([
    getExchangeContext(),
    getOwnProfile(),
  ]);
  const canOffer =
    kind !== "offer" ||
    Boolean(profile.data?.is_public && profile.data?.status === "approved");
  return (
    <ExchangePage
      title={
        kind === "offer"
          ? "Compartí tu disponibilidad."
          : "Publicá qué apoyo necesitás."
      }
      description="Una publicación puede incluir varias ubicaciones. El contacto se inicia con una solicitud que podés aceptar o rechazar."
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <ParticipationNotice context={context} />
          {kind === "offer" && !canOffer && (
            <div className={styles.notice}>
              <p>
                Para ofrecer servicios necesitás completar tu perfil
                profesional, elegir que sea público y esperar su revisión.
              </p>
              <Link href="/busquedas/perfil" className="text-link">
                Completar mi perfil profesional →
              </Link>
            </div>
          )}
          {profile.status === "unavailable" && (
            <ExchangeNotice status={profile.status} />
          )}
          <div className={styles.card}>
            <ListingForm
              key={`${kind}:${context.viewer?.id ?? "preview"}`}
              kind={kind}
              initialPlaces={[]}
              nonce={randomUUID()}
              disabled={
                context.status !== "ready" || !context.account || !canOffer
              }
            />
          </div>
        </div>
      </div>
    </ExchangePage>
  );
}
