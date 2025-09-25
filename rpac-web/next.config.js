/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  // Temporarily disable static export for development
  // output: 'export',
  // trailingSlash: true,
  // distDir: 'out',
};

module.exports = nextConfig;
