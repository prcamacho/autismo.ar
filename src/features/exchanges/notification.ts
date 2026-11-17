import { timingSafeEqual } from "node:crypto";

export function isWorkerAuthorized(
  header: string | null,
  token: string | undefined,
) {
  if (!token || token.length < 32 || !header?.startsWith("Bearer "))
    return false;
  const expected = Buffer.from(token);
  const actual = Buffer.from(header.slice(7));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function notificationOrigin(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("INVALID_NOTIFICATION_ORIGIN");
  return url.origin;
}

export function notificationContent(
  kind: "activity" | "retention",
  origin: string,
) {
  const url = `${notificationOrigin(origin)}/mensajes`;
  const subject =
    kind === "retention"
      ? "Revisá la conservación de tus conversaciones"
      : "Tenés novedades en autismo.ar";
  const message =
    kind === "retention"
      ? "Hay conversaciones inactivas que se eliminarán después del plazo informado en tu bandeja. Entrá para revisar el aviso."
      : "Hay novedades pendientes en tu bandeja. Entrá a autismo.ar para leerlas y decidir si querés responder.";
  const text = `autismo.ar\n${subject}\n\n${message}\n${url}\n\nPodés cambiar tus avisos por correo desde Búsquedas y disponibilidad. Este correo no recibe respuestas para la conversación.`;
  // All HTML is controlled by this template; no user text or private excerpts.
  // Inline light colors remain usable when an email client strips <style>. Dark
  // overrides use literal paired colors: email clients cannot rely on site CSS variables.
  const html = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>:root{color-scheme:light dark}.email-action:focus-visible{outline:3px solid #9b5b08;outline-offset:3px}@media(prefers-color-scheme:dark){.email-body{background:#101a28!important;color:#e4edf8!important}.email-card{background:#172435!important;color:#e4edf8!important}.email-action{background:#285fc2!important;color:#fff!important}.email-action:focus-visible{outline-color:#f2bf69}}@media(forced-colors:active){.email-action{border:2px solid LinkText}}</style></head><body class="email-body" style="margin:0;background:#f0f6fc;color:#173654;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td style="padding:24px"><table role="presentation" class="email-card" style="max-width:560px;width:100%;margin:auto;background:#fff;color:#173654;border-radius:12px"><tr><td style="padding:28px"><p style="font-size:18px;font-weight:bold">autismo.ar</p><h1 style="font-size:24px;line-height:1.3">${subject}</h1><p style="font-size:16px;line-height:1.6">${message}</p><p><a class="email-action" href="${url}" style="display:inline-block;padding:14px 20px;background:#245fcc;color:#fff;text-decoration:none;border-radius:8px">Abrir mi bandeja</a></p><p style="font-size:14px;line-height:1.6">Podés cambiar tus avisos por correo desde Búsquedas y disponibilidad. Este correo no recibe respuestas para la conversación.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function deliverNotification(
  input: {
    key: string;
    from: string;
    email: string;
    token: string;
    kind: "activity" | "retention";
    origin: string;
  },
  transport: typeof fetch = fetch,
) {
  const content = notificationContent(input.kind, input.origin);
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `exchange/${input.token}`,
    },
    body: JSON.stringify({ from: input.from, to: [input.email], ...content }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return false;
  // HTTP success alone is insufficient: an incomplete provider response must
  // retain the delivery key and remain retryable instead of losing the notice.
  try {
    const body: unknown = await response.json();
    return (
      typeof body === "object" &&
      body !== null &&
      "id" in body &&
      typeof body.id === "string" &&
      body.id.trim().length > 0 &&
      !("error" in body)
    );
  } catch {
    return false;
  }
}
