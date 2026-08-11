import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: 52 * 1024 * 1024,
  },
  outputFileTracingIncludes: {
    "/api/books/*/pdf/export": [
      "./assets/fonts/NotoSansArabic-Regular.ttf",
      "./node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-latin-400-normal.woff",
      "./node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-latin-400-normal.woff2",
    ],
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
