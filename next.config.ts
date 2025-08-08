import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during production builds to avoid failing Vercel deploys on lint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
