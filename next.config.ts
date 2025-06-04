import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qkhcrkhhefotlmfmnlbq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Reduce file watching to help with ENOENT errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after changes
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
  // Disable build optimizations that might cause file conflicts
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
