import type { CaptureResult } from "posthog-js";

export const ANALYTICS_ORIGIN = "https://autismo.ar";
export const POSTHOG_HOST = "https://us.i.posthog.com";

export type AnalyticsConfig = { token: string };

export function analyticsConfig(
  env: Record<string, string | undefined>,
): AnalyticsConfig | null {
  if (
    env.POSTHOG_ENABLED !== "true" ||
    env.NODE_ENV !== "production" ||
    env.RAILWAY_ENVIRONMENT_NAME !== "production" ||
    env.NEXT_PUBLIC_SITE_URL !== ANALYTICS_ORIGIN ||
    !/^phc_[A-Za-z0-9]+$/.test(env.POSTHOG_PROJECT_TOKEN ?? "")
  )
    return null;

  return { token: env.POSTHOG_PROJECT_TOKEN! };
}

const publicPages = new Set([
  "/",
  "/orientacion",
  "/directorio",
  "/recursos",
  "/articulos",
  "/profesionales",
  "/busquedas",
  "/comunidad",
  "/proyecto",
]);

// A closed list keeps private pages and future features out of analytics.
export function analyticsPath(pathname: string): string | null {
  if (publicPages.has(pathname)) return pathname;
  if (/^\/articulos\/autores\/[0-9a-f-]{36}$/i.test(pathname))
    return "/articulos/autores/[id]";
  if (/^\/articulos\/[0-9a-f-]{36}$/i.test(pathname)) return "/articulos/[id]";
  if (/^\/profesionales\/[0-9a-f-]{36}$/i.test(pathname))
    return "/profesionales/[id]";
  return null;
}

export function analyticsAllowed(
  origin: string,
  doNotTrack: string | null,
  globalPrivacyControl?: boolean,
): boolean {
  return (
    origin === ANALYTICS_ORIGIN &&
    doNotTrack !== "1" &&
    doNotTrack !== "yes" &&
    globalPrivacyControl !== true
  );
}

const publicAnalyticsPaths = new Set([
  ...publicPages,
  "/articulos/autores/[id]",
  "/articulos/[id]",
  "/profesionales/[id]",
]);

export function pageviewProperties(
  path: string,
  distinctId: string,
  sessionId: string,
) {
  if (
    !publicAnalyticsPaths.has(path) ||
    !/^autismo\.ar:[0-9a-f-]{36}$/i.test(distinctId) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  )
    return null;
  return {
    distinct_id: distinctId,
    $session_id: sessionId,
    $current_url: `${ANALYTICS_ORIGIN}${path}`,
    $host: "autismo.ar",
    $pathname: path,
    $process_person_profile: false,
    $geoip_disable: true,
    $ip: "0.0.0.0",
    site: "autismo.ar",
    environment: "production",
  };
}
export function sanitizePageview(
  event: CaptureResult,
  token: string,
): CaptureResult | null {
  if (event.event !== "$pageview") return null;
  const properties = pageviewProperties(
    event.properties.$pathname,
    event.properties.distinct_id,
    event.properties.$session_id,
  );
  return properties
    ? {
        uuid: event.uuid,
        event: "$pageview",
        timestamp: event.timestamp,
        properties: { ...properties, token },
      }
    : null;
}
