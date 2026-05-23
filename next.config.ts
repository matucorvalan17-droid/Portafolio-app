// WealthTrack — Next.js 15 Configuration
// This file controls how Next.js builds your app.
// You rarely need to edit this file.
// Learn more: https://nextjs.org/docs/app/api-reference/next-config-js

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // These packages must run on the server (not bundled into the browser)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  webpack: (config) => {
    // yahoo-finance2 has test helpers that import Deno-specific modules.
    // We stub those out here so the build doesn't fail.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@std/testing/mock':                        false,
      '@std/testing/bdd':                         false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
      '@gadicc/fetch-mock-cache/stores/fs.ts':     false,
    };
    return config;
  },
};

export default nextConfig;
