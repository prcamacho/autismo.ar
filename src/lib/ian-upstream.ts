const transformedHeaders = [
  "content-security-policy",
  "content-security-policy-report-only",
  "content-encoding",
  "content-length",
  "etag",
  "last-modified",
  "transfer-encoding",
  "x-frame-options",
];

export function getIanAppOrigin() {
  const origin = process.env.IAN_APP_ORIGIN?.trim().replace(/\/+$/, "");
  return origin || null;
}

export function copyIanUpstreamHeaders(
  upstream: Response,
  contentType?: string,
) {
  const headers = new Headers(upstream.headers);
  transformedHeaders.forEach((header) => headers.delete(header));
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}
