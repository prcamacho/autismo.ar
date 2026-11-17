import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { getViewer } from "@/features/auth/session";
import { getArticleStatus } from "@/features/articles/config";
import { getOwnProfile } from "@/features/articles/repository";
import {
  ArticleConnectionNotice,
  ArticleNav,
} from "@/features/articles/components";
import { ArticleEditor } from "@/features/articles/article-editor";
import { saveArticle } from "@/features/articles/actions";
import styles from "@/components/ui.module.css";

export const metadata = {
  title: "Escribir un artículo",
  robots: { index: false, follow: false },
};
export default async function NewArticlePage() {
  const status = getArticleStatus();
  const viewer = status === "ready" ? await getViewer() : null;
  const profile = viewer ? await getOwnProfile(viewer.id) : null;
  return (
    <>
      <PageIntro
        eyebrow="Crear un artículo"
        title="Compartí información útil, con tu voz."
        description="Prepará el contenido, revisá su presentación y guardalo como borrador. La publicación requiere revisión."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ArticleNav />
          <ArticleConnectionNotice status={status} />
          {status === "ready" && !viewer && (
            <p>
              Para guardar en tu cuenta,{" "}
              <Link href="/cuenta" className="text-link">
                ingresá con tu correo
              </Link>
              . También podés descargar un borrador local.
            </p>
          )}
          {viewer && !profile?.data && (
            <p>
              Antes de enviar a revisión,{" "}
              <Link href="/cuenta/perfil-autor" className="text-link">
                completá tu perfil de autor
              </Link>
              .
            </p>
          )}
          <ArticleEditor
            canSave={Boolean(viewer)}
            cafecitoAvailable={Boolean(profile?.data?.cafecito_approved)}
            saveAction={saveArticle}
          />
        </div>
      </div>
    </>
  );
}
