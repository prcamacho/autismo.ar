import { articleDraftSchema } from "./validation";

export type EditorSnapshot = {
  id: string | undefined;
  revision: number;
  fingerprint: string | null;
};

// PostgreSQL JSONB can return keys in a different order. Array order is content.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createEditorSnapshot(
  id: string | undefined,
  revision: number,
  content: unknown,
): EditorSnapshot {
  // Apply the same normalization as saveArticle, including trimmed text.
  const parsed = articleDraftSchema.safeParse(content);
  return {
    id,
    revision,
    fingerprint: parsed.success ? canonical(parsed.data) : null,
  };
}

/** Accept status-only refreshes; keep the expected version for content conflicts. */
export function reconcileEditorSnapshot(
  confirmed: EditorSnapshot,
  incoming: EditorSnapshot,
  saving: boolean,
): EditorSnapshot {
  if (
    !saving &&
    confirmed.id &&
    confirmed.id === incoming.id &&
    incoming.revision > confirmed.revision &&
    confirmed.fingerprint !== null &&
    confirmed.fingerprint === incoming.fingerprint
  )
    return incoming;
  return confirmed;
}
