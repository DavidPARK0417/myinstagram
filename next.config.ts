import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "*.supabase.co" }, // Supabase Storage 이미지
      { hostname: "images.unsplash.com" }, // Unsplash 이미지
    ],
    // 이미지 최적화 설정
    formats: ["image/avif", "image/webp"], // AVIF, WebP 우선 사용
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
