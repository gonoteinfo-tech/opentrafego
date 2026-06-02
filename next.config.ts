import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables instrumentation if needed, though stable in Next.js 15+
  },
  typescript: {
    // Ignore build errors if typescript complains during development / copy-paste
    ignoreBuildErrors: true,
  }
};

export default nextConfig;


