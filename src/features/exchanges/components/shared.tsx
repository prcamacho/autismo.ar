import Link from "next/link";
import type { ReactNode } from "react";
import type { ConnectionStatus } from "@/lib/result";
import { PageIntro } from "@/components/page-intro";
import { getPlaces } from "@/features/locations/catalog";
import { getProvinceName } from "@/lib/geography";
import { formatDate } from "@/lib/format";
import { MODALITIES, STATUS_LABELS, serviceName } from "../model";
import type {
  ListingRow,
  ListingView,
  PublicProfileData,
} from "../db-contract";
import styles from "../exchanges.module.css";
import { ProfileAvatar } from "./profile-avatar";

export function ExchangePage({
  title,
  description,
  children,
  current,
}: {
  title: string;
  description: string;
  children: ReactNode;
  current?: string;
}) {
  return (
    <>
      <PageIntro
        eyebrow="Búsquedas y disponibilidad"
        title={title}
        description={description}
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ExchangeNav current={current} />
          {children}
        </div>
      </div>
    </>
  );
}
export function ExchangeNav({ current }: { current?: string }) {
  return (
    <nav className={styles.nav} aria-label="Búsquedas y contacto">
      {[
        ["/busquedas", "Explorar"],
        ["/busquedas/mis-publicaciones", "Mis búsquedas y disponibilidad"],
        ["/busquedas/perfil", "Mi perfil profesional"],
        ["/mensajes", "Mis mensajes"],
        ["/catalogo/solicitudes", "Mis solicitudes al catálogo"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function ExchangeNotice({ status }: { status: ConnectionStatus }) {
  if (status === "ready") return null;
  return (
    <div className={styles.notice} role="status">
      <strong>
        {status === "unconfigured"
          ? "Este espacio está en preparación"
          : "No pudimos cargar este espacio"}
      </strong>
      <p>
        {status === "unconfigured"
          ? "Podés conocer los formularios. La publicación y el contacto todavía no están habilitados; no se enviará ni guardará información."
          : "Volvé a intentar. Una falla de conexión no significa que no haya publicaciones o mensajes."}
      </p>
    </div>
  );
}
export function SignInNotice() {
  return (
    <div className={styles.notice}>
      <p>
        Ingresá para ver búsquedas, publicar o contactar. Tu correo no se
        muestra a otras personas.
      </p>
      <Link href="/cuenta" className="text-link">
        Ingresar a mi cuenta →
      </Link>
    </div>
  );
}
export function EmptyPanel({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={styles.tag} data-status={value}>
      {STATUS_LABELS[value] ?? value}
    </span>
  );
}
export function LocationList({ ids }: { ids: string[] }) {
  const places = getPlaces(ids);
  return (
    <ul className={styles.locationList}>
      {places.map((place) => (
        <li key={place.id}>
          {place.name}
          {place.department && place.kind !== "neighborhood"
            ? `, ${place.department}`
            : ""}{" "}
          · {getProvinceName(place.province)}
        </li>
      ))}
    </ul>
  );
}
export function ListingCard({
  listing,
  manage = false,
}: {
  listing: ListingRow | ListingView;
  manage?: boolean;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.actions}>
        <span className={styles.tag}>
          {listing.kind === "offer" ? "Ofrece servicios" : "Busca profesional"}
        </span>
        <Status value={listing.status} />
      </div>
      <h2>
        <Link href={`/busquedas/${listing.id}`}>{listing.data.title}</Link>
      </h2>
      <p>
        {serviceName(listing.data.service, listing.data.role)} ·{" "}
        {MODALITIES[listing.data.modality]}
      </p>
      <LocationList ids={listing.data.locationIds} />
      <p className={styles.meta}>
        {listing.expires_at
          ? `Vigencia hasta ${formatDate(listing.expires_at)}`
          : "Pendiente de publicación"}
      </p>
      {manage && (
        <Link href={`/busquedas/${listing.id}/editar`}>Editar publicación</Link>
      )}
    </article>
  );
}
export function ProfileSummary({
  id,
  data,
}: {
  id: string;
  data: PublicProfileData;
}) {
  return (
    <div className={styles.profileHeading}>
      <ProfileAvatar
        key={id}
        id={id}
        name={data.name}
        hasPhoto={data.hasPhoto}
      />
      <div className={styles.compact}>
        <h2>
          <Link href={`/profesionales/${id}`}>{data.name}</Link>
        </h2>
        <p>{data.title}</p>
      </div>
    </div>
  );
}
export const privateMetadata = {
  robots: { index: false, follow: false },
  description:
    "Búsquedas, disponibilidad y contacto entre personas y profesionales en autismo.ar.",
} as const;
