import type { Metadata } from "next";
import Link from "next/link";
import {
  getExchangeContext,
  getOwnProfile,
} from "@/features/exchanges/repository";
import {
  ExchangeNotice,
  ExchangePage,
  Status,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ParticipationNotice } from "@/features/exchanges/components/participation-notice";
import { ProfileForm } from "@/features/exchanges/components/profile-form";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Mi perfil profesional",
};
export default async function OwnProfilePage() {
  const [context, profile] = await Promise.all([
    getExchangeContext(),
    getOwnProfile(),
  ]);
  return (
    <ExchangePage
      title="Tu perfil profesional."
      description="Presentá tu formación y experiencia una sola vez. Después elegís la disponibilidad y las zonas de cada publicación."
      current="/busquedas/perfil"
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <ParticipationNotice context={context} />
          {profile.status === "unavailable" && (
            <ExchangeNotice status={profile.status} />
          )}
          {profile.data && (
            <div className={styles.card}>
              <Status value={profile.data.status} />
              {profile.data.review_note && (
                <p className={styles.prose}>{profile.data.review_note}</p>
              )}
              <p className={styles.meta}>
                {profile.data.is_public
                  ? "Elegiste un perfil público cuando se apruebe."
                  : "Tu perfil no es público."}
              </p>
              {profile.data.status === "approved" && profile.data.is_public && (
                <Link
                  href={`/profesionales/${profile.data.id}`}
                  className="text-link"
                >
                  Ver mi perfil público →
                </Link>
              )}
            </div>
          )}
          <div className={styles.card}>
            <ProfileForm
              key={context.viewer?.id ?? "preview"}
              profile={profile.data}
              disabled={
                context.status !== "ready" ||
                !context.account ||
                profile.status === "unavailable"
              }
              photosAvailable={context.photosAvailable}
            />
          </div>
        </div>
      </div>
    </ExchangePage>
  );
}
