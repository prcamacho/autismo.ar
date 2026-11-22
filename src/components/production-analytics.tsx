"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { PostHog } from "posthog-js";
import {
  analyticsAllowed,
  analyticsPath,
  sanitizePageview,
  POSTHOG_HOST,
  type AnalyticsConfig,
} from "@/lib/analytics";

let client: Promise<PostHog> | undefined;

function browserAllowsAnalytics() {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  return analyticsAllowed(
    window.location.origin,
    navigator.doNotTrack,
    privacy.globalPrivacyControl,
  );
}

function loadClient(token: string) {
  client ??= import("posthog-js")
    .then(({ default: posthog }) => {
      const fetchOptions: RequestInit = {
        cache: "no-store",
        priority: "low",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      };
      posthog.init(token, {
        api_host: POSTHOG_HOST,
        ui_host: "https://us.posthog.com",
        persistence: "memory",
        disable_persistence: true,
        person_profiles: "never",
        bootstrap: { distinctID: `autismo.ar:${crypto.randomUUID()}` },
        fetch_options: fetchOptions,
        disableDeviceModel: true,
        save_referrer: false,
        save_campaign_params: false,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_conversations: true,
        disable_product_tours: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        respect_dnt: true,
        before_send(event) {
          return browserAllowsAnalytics()
            ? sanitizePageview(event, token)
            : null;
        },
      });
      return posthog;
    })
    .catch((error: unknown) => {
      client = undefined;
      throw error;
    });
  return client;
}

export function ProductionAnalytics({ config }: { config: AnalyticsConfig }) {
  const pathname = usePathname();
  const lastRoute = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = analyticsPath(pathname);
    if (!path || !browserAllowsAnalytics()) {
      lastRoute.current = null;
      return;
    }
    void loadClient(config.token)
      .then((posthog) => {
        if (
          cancelled ||
          !browserAllowsAnalytics() ||
          window.location.pathname !== pathname ||
          lastRoute.current === pathname
        )
          return;
        lastRoute.current = pathname;
        posthog.capture("$pageview", { $pathname: path });
      })
      .catch(() => {
        // Analytics is optional: blocked scripts or connectivity must not break navigation.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, config.token]);

  return null;
}
