import { PageIntro } from "@/components/page-intro";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import { getOwnProfile } from "@/features/articles/repository";
import {
  ArticleConnectionNotice,
  ArticleNav,
  AuthorSignIn,
} from "@/features/articles/components";
import { AuthorProfileForm } from "@/features/articles/profile-form";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Mi perfil de autor",
  robots: { index: false, follow: false },
};
export default async function AuthorProfilePage() {
  const status = getArticleStatus();
  const viewer = status === "ready" ? await getViewer() : null;
  const profile = viewer ? await getOwnProfile(viewer.id) : null;
  return (
    <>
      <PageIntro
        eyebrow="Mi perfil de autor"
        title="Una firma para tus artículos."
        description="Configurá tu presentación pública y, si querés, tu botón de Cafecito. Después elegís en qué artículos mostrarlo."
      />
      <div className="container section-small">
        <div className={`${styles.narrow} ${styles.stack}`}>
          <ArticleNav />
          <ArticleConnectionNotice status={profile?.status ?? status} />
          {status === "ready" && !viewer && <AuthorSignIn />}
          {viewer && profile?.status === "ready" && (
            <>
              <AuthorProfileForm profile={profile.data} />
              {profile.data?.cafecito_slug && (
                <div className={styles.callout}>
                  <strong>
                    {profile.data.cafecito_approved
                      ? "Cafecito habilitado"
                      : profile.data.decision_note
                        ? "Revisá tu enlace de Cafecito"
                        : "Cafecito pendiente de revisión"}
                  </strong>
                  <p>
                    {profile.data.decision_note ||
                      "El botón se mostrará solo en los artículos donde lo actives, una vez revisado el destino."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
