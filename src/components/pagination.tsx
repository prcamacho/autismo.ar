import Link from "next/link";
import styles from "./ui.module.css";

export function Pagination({
  page,
  hasMore,
  href,
}: {
  page: number;
  hasMore: boolean;
  href: string;
}) {
  const link = (p: number) =>
    `${href}${href.includes("?") ? "&" : "?"}pagina=${p}`;
  if (page === 1 && !hasMore) return null;
  return (
    <nav className={styles.pager} aria-label="Páginas de resultados">
      {page > 1 && (
        <Link href={link(page - 1)} className="text-link">
          Anterior
        </Link>
      )}
      <span>Página {page}</span>
      {hasMore && (
        <Link href={link(page + 1)} className="text-link">
          Siguiente
        </Link>
      )}
    </nav>
  );
}
