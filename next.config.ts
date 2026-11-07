import type { NextConfig } from "next";

// Backend manzili (Swagger: https://yeteper714.pythonanywhere.com/api/docs/)
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://yeteper714.pythonanywhere.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fixingtools.pythonanywhere.com" },
      { protocol: "https", hostname: "yeteper714.pythonanywhere.com" },
    ],
  },
  // /api/* so'rovlarini backendga proxy qilamiz (CORS muammosi bo'lmaydi).
  // Django URL'lari "/" bilan tugashi kerak, shuning uchun oxiriga "/" qo'shamiz.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
