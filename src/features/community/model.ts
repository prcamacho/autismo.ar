export const proposalStatuses = {
  submitted: {
    label: "En moderación",
    description:
      "Se está revisando que el aporte sea pertinente y contenga información pública.",
  },
  reviewing: {
    label: "Por corroborar",
    description:
      "La comunidad puede comprobar los datos y aportar fuentes independientes.",
  },
  approved: {
    label: "Publicado",
    description:
      "El aporte se incorporó a la ficha. Consultá las comprobaciones de cada dato.",
  },
  rejected: {
    label: "No incorporado",
    description:
      "El aporte no se incorporó. Su autor puede consultar el motivo y preparar una nueva propuesta.",
  },
} as const;
export type ProposalStatus = keyof typeof proposalStatuses;
export const checkFields = {
  name: "Nombre e identidad del recurso",
  location: "Ubicación y alcance",
  contact: "Contacto y horarios",
  coverage: "Cobertura informada",
  ages: "Edades atendidas",
  description: "Servicios ofrecidos",
} as const;
export type CheckField = keyof typeof checkFields;
export type ActionResult = {
  ok?: boolean;
  message?: string;
  id?: string;
  errors?: Record<string, string[]>;
};
export type ConnectionStatus = "ready" | "unconfigured" | "unavailable";
export type QueryResult<T> = { data: T; status: ConnectionStatus };

export type Proposal = {
  id: string;
  author_id: string;
  resource_id: string | null;
  base_version: number;
  data: import("@/features/resources/validation").ResourceInput;
  source_url: string;
  note: string;
  status: ProposalStatus;
  decision_note: string | null;
  created_at: string;
};
export type Corroboration = {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  field: CheckField;
  verdict: "matches" | "disagrees";
  source_url: string;
  checked_at: string;
};
