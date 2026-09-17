import Link from "next/link";
import { Plus } from "lucide-react";
import { PuzzleMark } from "@/components/puzzle-mark";

export function EmptyState({
  title = "Acá hay lugar para el primer aporte",
  description = "Estamos empezando a construir esta red. La información que conocés puede ser el punto de partida para otra familia.",
  href = "/aportar",
  action = "Preparar un aporte",
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <PuzzleMark />
      </div>
      <span className="eyebrow">Lo construimos entre todos</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link href={href} className="button">
        <Plus size={17} />
        {action}
      </Link>
    </div>
  );
}
