/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'yahoo-finance2'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // yahoo-finance2 has a fetchCache test helper that imports Deno-specific modules.
    // These are only used in development/testing, so we stub them out.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@std/testing/mock': false,
      '@std/testing/bdd': false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
      '@gadicc/fetch-mock-cache/stores/fs.ts': false,
    };
    return config;
  },
};

export default nextConfig;
