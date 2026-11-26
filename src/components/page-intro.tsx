import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <div className="container">
        <nav className="breadcrumb" aria-label="Ubicación">
          <Link href="/">Inicio</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span>{eyebrow}</span>
        </nav>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>
    </div>
  );
}
