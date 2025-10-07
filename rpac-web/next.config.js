/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  // Development configuration - comment out for production
  // output: 'export',
  // trailingSlash: true,
  // distDir: 'out',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
};

module.exports = nextConfig;
