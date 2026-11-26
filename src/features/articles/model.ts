export const ARTICLE_LIMITS = {
  title: 160,
  summary: 300,
  locality: 100,
  blocks: 40,
  text: 3000,
  listItems: 30,
  listItem: 1000,
  tableColumns: 8,
  tableRows: 30,
  tableHeader: 100,
  tableCell: 1000,
  linkLabel: 160,
  url: 1000,
  agendaRows: 60,
  agendaTitle: 160,
  agendaDetails: 1000,
  sources: 10,
  documentBytes: 60000,
} as const;

export const ARTICLE_THEMES = {
  blue: "Azul",
  teal: "Verde azulado",
  violet: "Violeta",
} as const;

export const ARTICLE_HEADING_STYLES = {
  plain: "Simple",
  band: "Con fondo destacado",
} as const;

export const AGENDA_KINDS = {
  request: "Solicitud de turno",
  appointment: "Atención",
  activity: "Actividad",
} as const;

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; url: string }
  | { type: "youtube"; label: string; url: string; display: "link" | "embed" }
  | { type: "table"; headers: string[]; rows: string[][] };

export type AgendaRow = {
  date: string;
  title: string;
  details: string;
  kind: keyof typeof AGENDA_KINDS;
};

export type ArticleSource = { label: string; url: string };

export type ArticleInput = {
  title: string;
  summary: string;
  kind: "article" | "agenda";
  category: string;
  province: string;
  locality: string;
  expiresOn: string;
  theme: keyof typeof ARTICLE_THEMES;
  headingStyle: keyof typeof ARTICLE_HEADING_STYLES;
  showCafecito: boolean;
  blocks: ArticleBlock[];
  agenda: AgendaRow[];
  sources: ArticleSource[];
};

export const EMPTY_ARTICLE: ArticleInput = {
  title: "",
  summary: "",
  kind: "article",
  category: "",
  province: "",
  locality: "",
  expiresOn: "",
  theme: "blue",
  headingStyle: "plain",
  showCafecito: false,
  blocks: [],
  agenda: [],
  sources: [],
};

export function createEmptyArticle(): ArticleInput {
  return { ...EMPTY_ARTICLE, blocks: [], agenda: [], sources: [] };
}
