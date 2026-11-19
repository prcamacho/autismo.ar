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
import {
  getServiceCatalog,
  getCatalogRequests,
} from "@/features/services/repository";
import { getPlaces } from "@/features/locations/catalog";
import { listingSchema, uuidSchema } from "@/features/exchanges/validation";
import type { ListingData } from "@/features/exchanges/model";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Nueva publicación",
};
export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    solicitud?: string;
    service?: string;
  }>;
}) {
  const params = await searchParams;
  const kind = params.tipo === "offer" ? "offer" : "request";
  const [context, profile, catalog] = await Promise.all([
    getExchangeContext(),
    getOwnProfile(),
    getServiceCatalog(),
  ]);
  const draft: Partial<ListingData> = {};
  if (params.service && catalog.data.some((s) => s.id === params.service))
    draft.service = params.service;
  if (params.solicitud && uuidSchema.safeParse(params.solicitud).success) {
    const requests = await getCatalogRequests({ id: params.solicitud });
    const request = requests.data[0];
    if (
      request?.status === "accepted" &&
      request.service_id &&
      request.draft &&
      request.draft.kind === kind
    ) {
      for (const [key, schema] of Object.entries(listingSchema.shape)) {
        const parsed = schema.safeParse(request.draft[key]);
        if (parsed.success) Object.assign(draft, { [key]: parsed.data });
      }
      draft.service = request.service_id;
      draft.role = catalog.data.find((s) => s.id === request.service_id)?.name;
    }
  }
  let initialPlaces: ReturnType<typeof getPlaces> = [];
  try {
    initialPlaces = getPlaces(draft.locationIds ?? []);
  } catch {
    draft.locationIds = [];
  }
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
          <ExchangeNotice status={catalog.status} />
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
              key={`${kind}:${context.viewer?.id ?? "preview"}:${params.solicitud ?? ""}:${params.service ?? ""}`}
              kind={kind}
              services={catalog.data}
              draft={draft}
              initialPlaces={initialPlaces}
              nonce={randomUUID()}
              disabled={
                context.status !== "ready" ||
                catalog.status !== "ready" ||
                !context.account ||
                !canOffer
              }
            />
          </div>
        </div>
      </div>
    </ExchangePage>
  );
}
