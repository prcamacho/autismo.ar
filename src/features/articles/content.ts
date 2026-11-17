import { AGENDA_KINDS, ARTICLE_LIMITS, type ArticleInput } from "./model";

/** Calendar-only data: never parse a date-only value in the browser's timezone. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

export function formatArticleDate(value: string): string {
  if (!isCalendarDate(value)) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export type InlineText = { text: string; bold: boolean };

/** Returns text tokens only; consumers must render them as text nodes. */
export function articleInlineText(value: string): InlineText[] {
  const tokens: InlineText[] = [];
  const expression = /\*\*([^*\n]+)\*\*/g;
  let position = 0;
  for (const match of value.matchAll(expression)) {
    const index = match.index;
    if (index > position)
      tokens.push({ text: value.slice(position, index), bold: false });
    tokens.push({ text: match[1], bold: true });
    position = index + match[0].length;
  }
  if (position < value.length || tokens.length === 0)
    tokens.push({ text: value.slice(position), bold: false });
  return tokens;
}

function plainText(value: string) {
  return articleInlineText(value)
    .map(({ text }) => text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(value: string, maximum: number) {
  const points = Array.from(value);
  return points.length <= maximum
    ? value
    : `${points
        .slice(0, maximum - 1)
        .join("")
        .trimEnd()}…`;
}

/** Plain text for metadata/share messages, never an HTML string. */
export function articleSummary(input: ArticleInput): string {
  const explicit = plainText(input.summary);
  if (explicit) return shorten(explicit, ARTICLE_LIMITS.summary);
  if (input.kind === "agenda") {
    const summary = input.agenda
      .filter((row) => isCalendarDate(row.date) && row.title.trim())
      .map(
        (row) =>
          `${formatArticleDate(row.date)} · ${AGENDA_KINDS[row.kind]}: ${plainText(row.title)}`,
      )
      .join("; ");
    if (summary) return shorten(summary, ARTICLE_LIMITS.summary);
  }
  const body = input.blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
        case "heading":
        case "callout":
          return block.text;
        case "list":
          return block.items.join(" · ");
        case "link":
          return block.label;
        case "table":
          return [
            block.headers.join(" · "),
            ...block.rows.map((r) => r.join(" · ")),
          ].join("; ");
      }
    })
    .join(" ");
  return shorten(
    plainText(body) || plainText(input.title),
    ARTICLE_LIMITS.summary,
  );
}

/** The caller supplies the public, canonical article URL. */
export function articleShareText(
  title: string,
  summary: string,
  url: string,
): string {
  return [plainText(title), plainText(summary), url]
    .filter(Boolean)
    .join("\n\n");
}

export function articleHasExpired(expiresOn: string, today: string): boolean {
  return (
    isCalendarDate(expiresOn) && isCalendarDate(today) && expiresOn < today
  );
}
