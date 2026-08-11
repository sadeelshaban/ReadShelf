import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: 52 * 1024 * 1024,
    outputFileTracingIncludes: {
      "/api/books/[id]/pdf/export/route": [
        "./assets/fonts/NotoSansArabic-Regular.ttf",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
    ],
  },
};

export default nextConfig;
