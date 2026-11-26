import { isPublicHttpUrl } from "@/lib/public-url";

/** Keep in sync with article_youtube_id in SQL. Never embed a user-supplied URL. */
export function youtubeVideoId(value: string): string | null {
  const url = value.trim();
  if (!isPublicHttpUrl(url)) return null;
  const base = url.split(/[?#]/, 1)[0];
  const direct =
    /^https:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:shorts|live|embed)|youtu\.be)\/([A-Za-z0-9_-]{11})\/?$/.exec(
      base,
    );
  if (direct) return direct[1];
  if (!/^https:\/\/(?:www\.|m\.)?youtube\.com\/watch$/.test(base)) return null;
  const query = url.split("#", 1)[0].split("?").slice(1).join("?");
  const ids = query.split("&").filter((part) => part.startsWith("v="));
  return ids.length === 1 && /^v=[A-Za-z0-9_-]{11}$/.test(ids[0])
    ? ids[0].slice(2)
    : null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
