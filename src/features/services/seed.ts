import type { Service } from "./model";

const medicalSource =
  "https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1";
const entries: [string, string, string[]][] = [
  [
    "inclusion-escolar",
    "Apoyo a la inclusión escolar",
    [
      "mai",
      "aie",
      "maestra integradora",
      "maestro integrador",
      "integracion escolar",
    ],
  ],
  [
    "acompanamiento-terapeutico",
    "Acompañamiento terapéutico",
    ["at", "acompanante terapeutico"],
  ],
  ["psicologia", "Psicología", ["psicologo", "psicologa"]],
  ["psicopedagogia", "Psicopedagogía", ["psicopedagogo", "psicopedagoga"]],
  [
    "fonoaudiologia",
    "Fonoaudiología",
    ["fono", "fonoaudiologo", "fonoaudiologa"],
  ],
  [
    "terapia-ocupacional",
    "Terapia ocupacional",
    ["to", "terapista ocupacional", "terapeuta ocupacional"],
  ],
  [
    "kinesiologia",
    "Kinesiología",
    ["kinesio", "kinesiologo", "kinesiologa", "fisioterapia"],
  ],
  [
    "trabajo-social",
    "Trabajo social",
    ["trabajador social", "trabajadora social", "asistente social"],
  ],
  [
    "nutricion",
    "Nutrición (licenciados)",
    ["nutricionista", "licenciatura en nutricion"],
  ],
  ["psicomotricidad", "Psicomotricidad", ["psicomotricista"]],
  ["musicoterapia", "Musicoterapia", ["musicoterapeuta"]],
  [
    "medicina-general",
    "Medicina general y de familia",
    ["medico general", "medica general", "medicina familiar", "generalista"],
  ],
  [
    "clinica-medica",
    "Clínica médica",
    ["medicina interna", "medico clinico", "medica clinica"],
  ],
  ["pediatria", "Pediatría", ["pediatra"]],
  ["geriatria", "Geriatría", ["geriatra"]],
  ["neurologia", "Neurología", ["neurologo", "neurologa"]],
  [
    "neurologia-infantil",
    "Neurología infantil",
    [
      "neuropediatra",
      "neuropediatria",
      "neurologo infantil",
      "neurologa infantil",
      "neurologia pediatrica",
    ],
  ],
  ["psiquiatria", "Psiquiatría", ["psiquiatra"]],
  [
    "psiquiatria-infantojuvenil",
    "Psiquiatría infantojuvenil",
    [
      "psiquiatra infantil",
      "psiquiatria infantil",
      "psiquiatria infanto juvenil",
    ],
  ],
  ["fisiatria", "Fisiatría", ["fisiatra", "medicina fisica y rehabilitacion"]],
  ["genetica-medica", "Genética médica", ["genetista"]],
  [
    "gastroenterologia",
    "Gastroenterología",
    ["gastroenterologo", "gastroenterologa"],
  ],
  [
    "gastroenterologia-infantil",
    "Gastroenterología infantil",
    ["gastroenterologo infantil", "gastroenterologia pediatrica"],
  ],
  ["endocrinologia", "Endocrinología", ["endocrinologo", "endocrinologa"]],
  [
    "endocrinologia-infantil",
    "Endocrinología infantil",
    ["endocrinologo infantil", "endocrinologia pediatrica"],
  ],
  [
    "alergia-inmunologia",
    "Alergia e inmunología",
    ["alergista", "alergologo", "inmunologo"],
  ],
  ["cardiologia", "Cardiología", ["cardiologo", "cardiologa"]],
  ["dermatologia", "Dermatología", ["dermatologo", "dermatologa"]],
  [
    "neumonologia",
    "Neumonología",
    ["neumonologo", "neumonologa", "neumologia"],
  ],
  ["oftalmologia", "Oftalmología", ["oftalmologo", "oftalmologa", "oculista"]],
  [
    "otorrinolaringologia",
    "Otorrinolaringología",
    ["otorrino", "otorrinolaringologo"],
  ],
  [
    "ortopedia-traumatologia",
    "Ortopedia y traumatología",
    ["traumatologo", "traumatologa", "ortopedista"],
  ],
  ["ginecologia", "Ginecología", ["ginecologo", "ginecologa"]],
];

// Snapshot for migration parity and legacy labels. Runtime choices come from the database.
export const INITIAL_SERVICES: Service[] = entries.map(
  ([id, name, aliases], index) => ({
    id,
    name,
    aliases,
    selectable: true,
    group_name: index < 11 ? "Apoyos y disciplinas" : "Especialidades médicas",
    source_url: index < 11 ? "" : medicalSource,
  }),
);
