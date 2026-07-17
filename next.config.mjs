/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint runs as its own step (`npm run lint`); don't block production builds on it.
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Keep the heavy browser-automation deps out of the client/server bundles.
    // Playwright must stay external — it loads browser binaries at runtime and
    // cannot be webpack-bundled.
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "playwright", "playwright-core"],
  },
};

export default nextConfig;
