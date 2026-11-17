export const SERVICES = [
  { id: "inclusion-escolar", name: "Apoyo a la inclusión escolar" },
  { id: "acompanamiento-terapeutico", name: "Acompañamiento terapéutico" },
  { id: "psicologia", name: "Psicología" },
  { id: "psicopedagogia", name: "Psicopedagogía" },
  { id: "fonoaudiologia", name: "Fonoaudiología" },
  { id: "terapia-ocupacional", name: "Terapia ocupacional" },
  { id: "kinesiologia", name: "Kinesiología" },
  { id: "medicina", name: "Medicina" },
  { id: "otros-apoyos", name: "Otros apoyos profesionales" },
] as const;

export const DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;
export const SHIFTS = ["manana", "tarde", "noche"] as const;
export const AGE_GROUPS = [
  "Infancia",
  "Adolescencia",
  "Adultez",
  "Personas mayores",
] as const;
export const MODALITIES = {
  presencial: "Presencial",
  virtual: "Virtual",
  mixta: "Presencial y virtual",
} as const;
export const AVAILABILITY = {
  available: "Disponible",
  limited: "Disponibilidad limitada",
  unavailable: "Sin disponibilidad",
} as const;
export const STATUS_LABELS: Record<string, string> = {
  pending: "En revisión",
  approved: "Revisado",
  published: "Publicado",
  rejected: "Requiere cambios",
  paused: "Pausado",
  closed: "Cerrado",
  accepted: "Aceptada",
  blocked: "Contacto bloqueado",
};

export const EXCHANGE_LIMITS = {
  locations: 30,
  requestsPerDay: 5,
  introduction: 800,
  message: 2000,
  requestDays: 30,
  offerDays: 60,
  retentionDays: 90,
  pageSize: 20,
  photoInputBytes: 2 * 1024 * 1024,
  photoOutputBytes: 150 * 1024,
} as const;

export type ProfileData = {
  name: string;
  title: string;
  institution: string;
  graduationYear: number | null;
  registration: string;
  experienceYears: number;
  description: string;
  ageGroups: string[];
  photoPath: string | null;
};

export type ListingKind = "offer" | "request";
export type ListingData = {
  title: string;
  service: string;
  role: string;
  description: string;
  modality: keyof typeof MODALITIES;
  days: string[];
  shifts: string[];
  startDate: string;
  availability: keyof typeof AVAILABILITY;
  engagement: string;
  ageGroups: string[];
  locationIds: string[];
  receiveRequests: boolean;
};

export function serviceName(id: string) {
  return (
    SERVICES.find((service) => service.id === id)?.name ??
    "Servicio profesional"
  );
}
