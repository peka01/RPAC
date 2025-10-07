/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  // Production configuration for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
};

module.exports = nextConfig;
