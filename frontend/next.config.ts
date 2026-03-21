import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.NEXT_INTERNAL_API_URL ?? 'http://backend:3000';
    return {
      afterFiles: [
        { source: '/api/:path*', destination: `${backendUrl}/:path*` },
        { source: '/embed/:path*', destination: `${backendUrl}/embed/:path*` },
        { source: '/notion-lp/:path*', destination: `${backendUrl}/notion-lp/:path*` },
      ],
    };
  },
};

export default nextConfig;
