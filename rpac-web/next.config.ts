import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  serverExternalPackages: [],
  distDir: 'out',
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
};

export default nextConfig;
