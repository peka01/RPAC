import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable static export to fix webpack issues
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
