export const NOMENCLATOR_SOURCE =
  "https://www.argentina.gob.ar/normativa/nacional/62835/actualizacion";

export const CATEGORIES = [
  {
    id: "terapias",
    name: "Apoyos terapéuticos",
    hint: "Terapias y rehabilitación",
  },
  { id: "educacion", name: "Educación", hint: "Escuela y formación laboral" },
  { id: "centros", name: "Centros", hint: "Atención en instituciones" },
  { id: "transporte", name: "Transporte", hint: "Traslados a prestaciones" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type Benefit = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  terms: string[];
};

// Muestra editorial, no catálogo completo ni tabla de equivalencias clínicas.
// Los identificadores son internos; no representan códigos oficiales.
export const BENEFITS: Benefit[] = [
  {
    id: "maestro-apoyo",
    category: "educacion",
    name: "Módulo Maestro de Apoyo",
    description: "Apoyo pedagógico en la escolaridad común.",
    terms: [
      "escuela",
      "escolar",
      "maestra",
      "integracion",
      "inclusion",
      "mai",
      "aie",
    ],
  },
  {
    id: "prestaciones-apoyo",
    category: "terapias",
    name: "Prestaciones de apoyo",
    description: "Complemento o refuerzo de otra prestación principal.",
    terms: [
      "terapia",
      "fonoaudiologia",
      "psicologia",
      "psicopedagogia",
      "terapia ocupacional",
      "kinesiologia",
    ],
  },
  {
    id: "transporte",
    category: "transporte",
    name: "Transporte",
    description: "Traslados entre el domicilio y el lugar de atención.",
    terms: ["traslado", "viaje", "transporte especial", "combi"],
  },
  {
    id: "integracion-escolar",
    category: "educacion",
    name: "Módulo de Apoyo a la Integración Escolar (Equipo)",
    description: "Apoyo de un equipo a la escolaridad común.",
    terms: ["escuela", "inclusion", "maestra", "mai", "aie"],
  },
  {
    id: "centro-dia",
    category: "centros",
    name: "Centro de Día",
    description: "Atención orientada a la autonomía y la vida cotidiana.",
    terms: ["autonomia", "adultos", "jovenes", "centro"],
  },
  {
    id: "integral-simple",
    category: "terapias",
    name: "Módulo de tratamiento integral simple",
    description: "Tratamiento ambulatorio con distintas especialidades.",
    terms: [
      "rehabilitacion",
      "terapia",
      "fonoaudiologia",
      "psicologia",
      "psicopedagogia",
      "terapia ocupacional",
      "kinesiologia",
    ],
  },
  {
    id: "integral-intensivo",
    category: "terapias",
    name: "Módulo de tratamiento integral intensivo",
    description: "Tratamiento ambulatorio de semana completa.",
    terms: [
      "rehabilitacion",
      "terapia",
      "fonoaudiologia",
      "psicologia",
      "psicopedagogia",
      "terapia ocupacional",
      "kinesiologia",
    ],
  },
  {
    id: "estimulacion-temprana",
    category: "terapias",
    name: "Módulo de estimulación temprana",
    description: "Atención terapéutica durante la primera infancia.",
    terms: ["bebe", "infancia", "desarrollo"],
  },
  {
    id: "formacion-laboral",
    category: "educacion",
    name: "Formación laboral y/o rehabilitación profesional",
    description: "Preparación para la actividad laboral.",
    terms: ["trabajo", "capacitacion", "oficio", "adultos", "jovenes"],
  },
  {
    id: "centro-educativo-terapeutico",
    category: "centros",
    name: "Módulo Centro Educativo-Terapéutico",
    description: "Aprendizajes educativos mediante abordajes terapéuticos.",
    terms: ["cet", "centro", "educacion"],
  },
  {
    id: "hospital-dia",
    category: "centros",
    name: "Módulo: Hospital de Día",
    description:
      "Rehabilitación ambulatoria intensiva con concurrencia diaria.",
    terms: ["centro", "rehabilitacion"],
  },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function searchBenefits(query: string, category: CategoryId | "" = "") {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return BENEFITS.filter((item) => {
    if (category && item.category !== category) return false;
    const searchable = normalize([item.name, ...item.terms].join(" "));
    return words.every((word) => searchable.includes(word));
  });
}
