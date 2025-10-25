import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Add turbopack config to silence the error
  },
};

export default nextConfig;
