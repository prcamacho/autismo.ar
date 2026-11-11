import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { ContributionForm } from "@/features/community/contribution-form";
import { ConnectionNotice } from "@/components/connection-notice";
import { categories } from "@/lib/catalog";
import { getProvinceName } from "@/lib/geography";
import { getSupabaseStatus } from "@/lib/supabase/config";
import { getViewer } from "@/features/auth/session";
import {
  getResource,
  getResourceRevision,
} from "@/features/resources/repository";
import type { ResourceInput } from "@/features/resources/validation";
import styles from "@/components/ui.module.css";

export const metadata: Metadata = { title: "Aportar información" };
export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const resourceId = typeof params.ficha === "string" ? params.ficha : "";
  const resource = resourceId ? await getResource(resourceId) : null;
  if (resourceId && resource?.status === "ready" && !resource.data) notFound();
  const province =
    typeof params.provincia === "string" && getProvinceName(params.provincia)
      ? params.provincia
      : "";
  const category = categories.find((c) => c.id === params.categoria)?.id;
  let defaults: Partial<ResourceInput> = resource?.data?.data || {
    categoryIds: category ? [category] : [],
    province,
    locality:
      province && typeof params.localidad === "string"
        ? params.localidad.slice(0, 120)
        : "",
    scope: province ? "local" : "national",
  };
  let source = resource?.data?.source_url || "";
  const restore = Number(params.version);
  if (params.version !== undefined && resource?.data) {
    if (
      typeof params.version !== "string" ||
      !Number.isInteger(restore) ||
      restore < 1 ||
      restore >= resource.data.version
    )
      notFound();
    const revision = await getResourceRevision(resource.data.id, restore);
    if (revision.status !== "ready") {
      return (
        <div className="container section">
          <h1>No pudimos recuperar esa versión</h1>
          <ConnectionNotice status={revision.status} />
          <p>
            El formulario no se abrió con otros datos. Podés reintentar o volver
            a la ficha.
          </p>
          <a
            className="button"
            href={`/aportar?ficha=${encodeURIComponent(resourceId)}&version=${restore}`}
          >
            Volver a intentar
          </a>
          <Link
            className="text-link"
            href={`/directorio/${resource.data.slug}`}
          >
            Volver a la ficha
          </Link>
        </div>
      );
    }
    if (!revision.data) notFound();
    defaults = revision.data.data;
    source = revision.data.source_url;
  }
  const status = resource?.status || getSupabaseStatus();
  return (
    <>
      <PageIntro
        eyebrow="Aportar información"
        title="Un dato tuyo puede abrir otro camino."
        description="Sumá un recurso o ayudá a mantenerlo actualizado. Las fuentes y la revisión de otras personas lo convierten en información compartida."
      />
      <div className="container section-small">
        <div className={styles.stack}>
          <ConnectionNotice status={status} />
          {status === "ready" && !viewer && (
            <div className={styles.callout}>
              <strong>Ingresá para enviar tu aporte</strong>
              <p>También podés preparar y descargar un borrador ahora.</p>
              <Link className="text-link" href="/cuenta">
                Ingresar o crear mi cuenta
              </Link>
            </div>
          )}
          {resourceId && !resource?.data ? (
            <p>
              No pudimos cargar la ficha que querés corregir. Volvé a abrirla
              desde el directorio.
            </p>
          ) : (
            <div className={styles.layout}>
              <ContributionForm
                key={`${resource?.data?.id || "new"}:${resource?.data?.version || 0}:${restore || 0}:${category || ""}:${province}:${defaults.locality || ""}`}
                defaults={defaults}
                resourceId={resource?.data?.id}
                version={resource?.data?.version}
                sourceUrl={source}
                canSubmit={Boolean(viewer && status === "ready")}
              />
              <aside className={styles.stack}>
                <div className={styles.card}>
                  <ListChecks size={25} aria-hidden="true" />
                  <h3>Un aporte, varias miradas</h3>
                  <p>
                    Primero revisamos privacidad y pertinencia. Después otras
                    personas corroboran los datos. Moderación decide su
                    publicación.
                  </p>
                  <Link href="/comunidad" className="text-link">
                    Cómo construimos la información
                  </Link>
                </div>
                <div className={styles.card}>
                  <ShieldCheck size={25} aria-hidden="true" />
                  <h3>Compartir con cuidado</h3>
                  <p>
                    Usá contactos públicos y fuentes consultables. Las
                    experiencias personales tendrán un espacio propio cuando
                    esté preparado.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
