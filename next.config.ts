import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow larger request body (35MB for file uploads)
    serverActions: {
      bodySizeLimit: '35mb',
    },
  },
};

export default nextConfig;
