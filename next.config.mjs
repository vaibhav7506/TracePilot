/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint runs as its own step (`npm run lint`); don't block production builds on it.
    ignoreDuringBuilds: false,
  },
  // Playwright loads browser binaries at runtime and must remain external.
  serverExternalPackages: ["@prisma/client", "prisma", "playwright", "playwright-core"],
};

export default nextConfig;
