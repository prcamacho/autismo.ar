export type Service = {
  id: string;
  name: string;
  group_name: string;
  aliases: string[];
  selectable: boolean;
  source_url: string;
};

export const SERVICE_GROUPS = [
  "Apoyos y disciplinas",
  "Especialidades médicas",
] as const;
export const SCHOOL_ROLES = [
  "Apoyo a la inclusión escolar",
  "Maestro/a de apoyo a la inclusión (MAI)",
  "Acompañante de inclusión escolar (AIE)",
] as const;
export const ENGAGEMENTS = [
  "",
  "Particular",
  "Mediante institución",
  "Relación de dependencia",
  "A convenir",
] as const;
export const COVERAGES = [
  "",
  "Particular",
  "Obra social",
  "Prepaga",
  "Sistema público",
  "A consultar",
] as const;

export function normalizeTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Bounded edit distance: short ambiguous abbreviations only use explicit aliases.
function distance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array<number>(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  return rows[a.length][b.length];
}

export function searchServices(services: readonly Service[], query: string) {
  const q = normalizeTerm(query.slice(0, 120));
  const ranked = services
    .filter((s) => s.selectable)
    .map((service) => {
      const values = [service.name, ...service.aliases].map(normalizeTerm);
      let score = q ? Infinity : 4;
      for (const value of values) {
        if (value === q) score = Math.min(score, 0);
        else if (value.startsWith(q)) score = Math.min(score, 1);
        else if (
          q
            .split(" ")
            .every((token) =>
              value.split(" ").some((word) => word.startsWith(token)),
            )
        )
          score = Math.min(score, 2);
        else if (
          q.length >= 5 &&
          Math.abs(value.length - q.length) <= 2 &&
          distance(q, value) <= (q.length >= 9 ? 2 : 1)
        )
          score = Math.min(score, 3);
      }
      return { ...service, score, approximate: score === 3 };
    });
  return ranked
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "es-AR"));
}

export function serviceRoles(service?: Service) {
  return service?.id === "inclusion-escolar"
    ? [...SCHOOL_ROLES]
    : service
      ? [service.name]
      : [];
}

export type CatalogRequest = {
  id: string;
  user_id: string;
  nonce: string;
  requested_name: string;
  reason: string;
  source_url: string;
  status: "pending" | "accepted" | "rejected";
  response: string;
  service_id: string | null;
  draft: Record<string, unknown> | null;
  created_at: string;
  reviewed_by: string | null;
};
