const PROFILE_ORIGIN = "https://cafecito.app";
const EMBED_LIMIT = 4096;

export const CAFECITO_RESERVED_SLUGS = [
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "faq",
  "terms",
  "privacy_policies",
  "my_account",
  "explore",
  "explorar",
  "search",
  "settings",
  "account",
  "api",
  "auth",
  "admin",
  "posts",
  "plans",
  "buttons",
] as const;

export function isCafecitoSlug(value: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,59}$/.test(value) &&
    !CAFECITO_RESERVED_SLUGS.some(
      (reserved) => reserved === value.toLowerCase(),
    )
  );
}

export function cafecitoUrl(slug: string): string {
  if (!isCafecitoSlug(slug)) throw new Error("Invalid Cafecito profile");
  return `${PROFILE_ORIGIN}/${slug}`;
}

export type CafecitoDestination = { slug: string; url: string };

function profileDestination(value: string): CafecitoDestination | null {
  const match =
    /^https:\/\/cafecito\.app\/([a-zA-Z0-9][a-zA-Z0-9_-]{0,59})\/?$/.exec(
      value,
    );
  if (!match || !isCafecitoSlug(match[1])) return null;
  return { slug: match[1], url: cafecitoUrl(match[1]) };
}

// This recognizes a small data format, not arbitrary HTML. Nothing is parsed
// into a DOM, fetched, executed, or returned as HTML to a rendering sink.
function attributes(
  raw: string,
  allowed: readonly string[],
): Record<string, string> | null {
  const values: Record<string, string> = Object.create(null);
  const attribute = /\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/giy;
  let position = 0;
  while (position < raw.length) {
    if (raw.slice(position).trim() === "") break;
    attribute.lastIndex = position;
    const match = attribute.exec(raw);
    if (!match) return null;
    const name = match[1].toLowerCase();
    if (!allowed.includes(name) || Object.hasOwn(values, name)) return null;
    values[name] = match[2] ?? match[3];
    position = attribute.lastIndex;
  }
  return values;
}

function imageAsset(value: string) {
  return /^https:\/\/cdn\.cafecito\.app\/imgs\/buttons\/button_([1-9][0-9]?)(?:_(2x|3\.75x))?\.(png|svg)$/.exec(
    value,
  );
}

function validImage(values: Record<string, string>): boolean {
  const source = imageAsset(values.src || "");
  if (!source) return false;
  if (values.alt && values.alt.length > 300) return false;
  if (
    [values.width, values.height].some(
      (v) => v !== undefined && !/^[1-9][0-9]{0,3}$/.test(v),
    )
  )
    return false;
  if (!values.srcset) return true;
  const candidates = values.srcset.split(",");
  if (candidates.length > 3) return false;
  return candidates.every((candidate) => {
    const parts = candidate.trim().split(/\s+/);
    if (parts.length !== 2) return false;
    const image = imageAsset(parts[0]);
    return Boolean(
      image &&
      image[1] === source[1] &&
      image[3] === source[3] &&
      parts[1] === (image[2] || "1x"),
    );
  });
}

/**
 * Import only a profile URL or the link/image HTML or Markdown button format.
 * The provider documents these formats at:
 * https://cafecito.app/faq/como-usar-botones-de-cafecito
 * A new provider format must be reviewed explicitly, never executed as fallback.
 */
export function parseCafecitoEmbed(raw: string): CafecitoDestination | null {
  if (
    typeof raw !== "string" ||
    raw.length > EMBED_LIMIT ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)
  )
    return null;
  const input = raw.trim();
  const direct = profileDestination(input);
  if (direct) return direct;

  const markdown = /^\[!\[([^\]\n]*)\]\(([^\s()]+)\)\]\(([^\s()]+)\)$/.exec(
    input,
  );
  if (markdown) {
    return markdown[1].length <= 300 && imageAsset(markdown[2])
      ? profileDestination(markdown[3])
      : null;
  }

  const html = /^<a(\s[^<>]*?)>\s*<img(\s[^<>]*?)\s*\/?>\s*<\/a>$/i.exec(input);
  if (!html) return null;
  const anchor = attributes(html[1], ["href", "rel", "target"]);
  const image = attributes(html[2], [
    "src",
    "srcset",
    "alt",
    "width",
    "height",
  ]);
  if (!anchor || !image || !validImage(image)) return null;
  if (anchor.target !== undefined && anchor.target !== "_blank") return null;
  if (
    anchor.rel !== undefined &&
    !anchor.rel
      .split(/\s+/)
      .every((v) => ["noopener", "noreferrer", "nofollow"].includes(v))
  )
    return null;
  return profileDestination(anchor.href || "");
}
