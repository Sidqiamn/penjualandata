import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // file lampiran email (private/files) ikut terbawa ke server Vercel
  outputFileTracingIncludes: {
    "/api/**/*": ["./private/files/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
