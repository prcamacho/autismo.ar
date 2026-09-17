import type { NextConfig } from "next";

const ianAppOrigin = process.env.IAN_APP_ORIGIN?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La PWA resuelve manifiesto, service worker y assets desde /apps/ian/.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    if (!ianAppOrigin) return [];

    return [
      {
        source: "/apps/ian/:path*",
        destination: `${ianAppOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
