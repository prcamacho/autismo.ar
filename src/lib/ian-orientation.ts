export const IAN_LANDSCAPE_FRAME_ID = "ian-landscape-frame";

const landscapeFrameStyles = `
:root{color-scheme:light;--ian-screen-height:100vh}
@supports(height:100dvh){:root{--ian-screen-height:100dvh}}
html,body{width:100%;height:100%;min-height:100%;margin:0;overflow:hidden;background:#244348}
#${IAN_LANDSCAPE_FRAME_ID}{position:fixed;top:50%;left:50%;display:block;width:100vw;height:var(--ian-screen-height);border:0;background:#f4f6f8;transform:translate(-50%,-50%);transform-origin:center}
@media(orientation:portrait){#${IAN_LANDSCAPE_FRAME_ID}{width:var(--ian-screen-height);height:100vw;transform:translate(-50%,-50%) rotate(90deg)}}
`;

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function prepareIanEmbeddedDocument(html: string, origin: string) {
  const base = `<base href="${escapeHtmlAttribute(`${origin}/`)}">`;

  if (/<head(?:\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}${base}`);
  }

  return `${base}${html}`;
}

export function buildIanLandscapeShell(html: string, origin: string) {
  const embeddedDocument = escapeHtmlAttribute(
    prepareIanEmbeddedDocument(html, origin),
  );

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#244348">
    <meta name="screen-orientation" content="landscape">
    <meta name="x5-orientation" content="landscape">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>App de Ian</title>
    <link rel="manifest" href="/apps/ian/manifest.json">
    <style>${landscapeFrameStyles}</style>
  </head>
  <body>
    <iframe
      id="${IAN_LANDSCAPE_FRAME_ID}"
      title="App de Ian"
      srcdoc="${embeddedDocument}"
      allow="autoplay; fullscreen"
      referrerpolicy="no-referrer"
    ></iframe>
  </body>
</html>`;
}

export function requireIanLandscape(manifest: unknown) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("El manifiesto de Ian no tiene un objeto JSON válido.");
  }

  return {
    ...(manifest as Record<string, unknown>),
    orientation: "landscape",
  };
}
