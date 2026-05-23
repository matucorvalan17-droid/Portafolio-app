// WealthTrack — Next.js 15 Configuration
// This file controls how Next.js builds your app.
// You rarely need to edit this file.
// Learn more: https://nextjs.org/docs/app/api-reference/next-config-js

import type { NextConfig } from 'next';

const securityHeaders = [
  // Block clickjacking — nobody can embed this app in an iframe
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent browsers from guessing content types (stops script injection via image uploads)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Stop referrer from leaking session tokens in URLs to third-party requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app never uses
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Force HTTPS for 1 year (browsers won't downgrade to HTTP after first visit)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // CSP: allow scripts/styles only from self + Next.js inline runtime;
  // allow images from clearbit (broker logos) and data URIs (compressed portfolio images);
  // connect to Yahoo Finance for price fetching.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval required by Next.js dev & some RSC internals
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://logo.clearbit.com https://*.googleusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

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
