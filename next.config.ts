import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.20'],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/*': ['./certs/supabase-ca.crt'],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
