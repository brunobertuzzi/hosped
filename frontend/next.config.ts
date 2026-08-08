import type { NextConfig } from "next";
import path from "path";

// Auto-configure the API URL for Railway deployment if not set
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = 'https://backend-production-3b5e.up.railway.app';
}
// @ts-expect-error next-pwa missing types
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-ae5409c0-14c2-4aa3-9fa5-44fcbe9f0480',
  },
  // standalone only for production Docker builds (see Dockerfile)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
