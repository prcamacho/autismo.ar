import type { Metadata } from "next";
import Link from "next/link";
import {
  getExchangeContext,
  getProfile,
} from "@/features/exchanges/repository";
import {
  EmptyPanel,
  ExchangeNotice,
  ExchangePage,
  ProfileSummary,
  privateMetadata,
} from "@/features/exchanges/components/shared";
import { ReportForm } from "@/features/exchanges/components/contact-forms";
import styles from "@/features/exchanges/exchanges.module.css";

export const metadata: Metadata = {
  ...privateMetadata,
  title: "Perfil profesional",
};
export default async function ProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, result] = await Promise.all([
    getExchangeContext(),
    getProfile(id),
  ]);
  const profile = result.data;
  return (
    <ExchangePage
      title="Perfil profesional."
      description="Formación y experiencia declaradas por la persona profesional."
    >
      <div className={styles.narrow}>
        <div className={styles.stack}>
          <ExchangeNotice status={result.status} />
          {profile ? (
            <>
              <article className={styles.card}>
                <ProfileSummary id={id} data={profile.data} />
                <p className={styles.prose}>{profile.data.description}</p>
                <dl className={styles.facts}>
                  <div>
                    <dt>Título o formación</dt>
                    <dd>{profile.data.title}</dd>
                  </div>
                  {profile.data.institution && (
                    <div>
                      <dt>Institución</dt>
                      <dd>{profile.data.institution}</dd>
                    </div>
                  )}
                  {profile.data.graduationYear && (
                    <div>
                      <dt>Egreso</dt>
                      <dd>{profile.data.graduationYear}</dd>
                    </div>
                  )}
                  {profile.data.registration && (
                    <div>
                      <dt>Matrícula o registro declarado</dt>
                      <dd>{profile.data.registration}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Experiencia declarada</dt>
                    <dd>{profile.data.experienceYears} años</dd>
                  </div>
                  {profile.data.ageGroups.length > 0 && (
                    <div>
                      <dt>Etapas de vida</dt>
                      <dd>{profile.data.ageGroups.join(", ")}</dd>
                    </div>
                  )}
                </dl>
                <p className={styles.notice}>
                  Formación y experiencia declaradas. La revisión del perfil no
                  certifica calidad clínica ni habilitación para todas las
                  funciones o jurisdicciones.
                </p>
                <p>
                  Para contactar, enviá una solicitud desde una publicación
                  activa.
                </p>
                <Link href="/busquedas" className="text-link">
                  Explorar disponibilidad →
                </Link>
              </article>
              {context.account && !profile.owner && (
                <ReportForm kind="profile" id={id} />
              )}
              {profile.owner && (
                <Link
                  href="/busquedas/perfil"
                  className="button button-secondary"
                >
                  Editar mi perfil profesional
                </Link>
              )}
            </>
          ) : (
            result.status === "ready" && (
              <EmptyPanel title="Este perfil no está disponible">
                <p>Puede ser privado o estar pendiente de revisión.</p>
                <Link href="/busquedas" className="text-link">
                  Explorar disponibilidad →
                </Link>
              </EmptyPanel>
            )
          )}
        </div>
      </div>
    </ExchangePage>
  );
}
