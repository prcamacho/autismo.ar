/** Public origin for canonical and social links. Configure the test origin separately. */
export function siteUrl(path: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://autismo.ar";
  const origin = new URL(configured);
  if (
    !["https:", "http:"].includes(origin.protocol) ||
    (origin.protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(origin.hostname)) ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== "/"
  )
    throw new Error("NEXT_PUBLIC_SITE_URL debe ser un origen HTTPS válido.");
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Ruta pública inválida.");
  const result = new URL(path, origin);
  if (result.origin !== origin.origin)
    throw new Error("Ruta pública inválida.");
  return result.href;
}
