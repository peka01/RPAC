/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
};

module.exports = nextConfig;
