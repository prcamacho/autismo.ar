import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Leave room for a 2 MB profile photo and multipart form fields. The server
    // validates image size/format and reserves upload quota before decoding.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
