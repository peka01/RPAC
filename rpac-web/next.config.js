/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  // Cloudflare Pages configuration for static export
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Disable API routes for static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
