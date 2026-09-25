import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { ResourceRecord } from "./model";
import { fieldValue } from "@/features/community/fields";
import { formatDate } from "@/features/community/components";
import styles from "@/features/community/community.module.css";

export function ResourceCard({ resource }: { resource: ResourceRecord }) {
  return (
    <article className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.status}>Ficha comunitaria</span>
        <span className={styles.meta}>
          Actualizada {formatDate(resource.published_at)}
        </span>
      </div>
      <h3>
        <Link href={`/directorio/${resource.slug}`}>{resource.data.name}</Link>
      </h3>
      <p>
        {resource.data.description.slice(0, 220)}
        {resource.data.description.length > 220 ? "…" : ""}
      </p>
      <p>
        <MapPin size={16} aria-hidden="true" />{" "}
        {fieldValue(resource.data, "location")}
      </p>
      <span className={styles.meta}>
        {resource.data.ageGroups.join(" · ") || "Edades no informadas"}
      </span>
      <Link className="text-link" href={`/directorio/${resource.slug}`}>
        Ver datos y fuentes <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
