import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    locales: ['en', 'bg'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
