/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  // Allow build to succeed with ESLint warnings (will fix gradually)
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false, // Keep linting but don't fail on warnings
  },
  typescript: {
    // Keep type checking but don't fail build
    ignoreBuildErrors: false,
  },
  // Production configuration for Cloudflare Pages (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  }),
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
};

module.exports = nextConfig;
