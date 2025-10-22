/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify is now default in Next.js 13+ and deprecated - removed
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
  // Hybrid rendering: Static pages + Dynamic routes for homespace
  // This works on Cloudflare Pages with Next.js runtime
  trailingSlash: true
};

module.exports = nextConfig;
