export const IAN_LANDSCAPE_FRAME_ID = "ian-landscape-frame";

const landscapeFrameStyles = `
:root{color-scheme:light;--ian-frame-width:100vw;--ian-frame-height:100vh;--ian-fit-scale:1}
html,body{width:100%;height:100%;min-height:100%;margin:0;overflow:hidden;background:#244348}
#${IAN_LANDSCAPE_FRAME_ID}{position:fixed;top:50%;left:50%;display:block;width:var(--ian-frame-width);height:var(--ian-frame-height);border:0;overflow:hidden;background:#f4f6f8;transform:translate(-50%,-50%) scale(var(--ian-fit-scale));transform-origin:center}
@media(orientation:portrait){#${IAN_LANDSCAPE_FRAME_ID}{transform:translate(-50%,-50%) rotate(90deg) scale(var(--ian-fit-scale))}}
`;

const landscapeFrameSizingScript = `
(()=>{const root=document.documentElement;const fit=()=>{const viewport=window.visualViewport;const width=viewport?.width||window.innerWidth;const height=viewport?.height||window.innerHeight;const portrait=height>width;const landscapeWidth=portrait?height:width;const landscapeHeight=portrait?width:height;const scale=Math.min(1,landscapeWidth/960,landscapeHeight/540);root.style.setProperty("--ian-frame-width",landscapeWidth/scale+"px");root.style.setProperty("--ian-frame-height",landscapeHeight/scale+"px");root.style.setProperty("--ian-fit-scale",String(scale))};fit();addEventListener("resize",fit,{passive:true});window.visualViewport?.addEventListener("resize",fit,{passive:true})})();
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
    <script>${landscapeFrameSizingScript}</script>
  </head>
  <body>
    <iframe
      id="${IAN_LANDSCAPE_FRAME_ID}"
      title="App de Ian"
      srcdoc="${embeddedDocument}"
      allow="autoplay; fullscreen"
      referrerpolicy="no-referrer"
      scrolling="no"
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
