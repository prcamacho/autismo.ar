import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState
        title="Todavía no hay una página acá"
        description="La dirección puede haber cambiado. Volvé al inicio para encontrar tu camino."
        href="/"
        action="Volver al inicio"
      />
    </div>
  );
}
