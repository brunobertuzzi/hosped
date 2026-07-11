import type { NextConfig } from "next";

// Auto-configure the API URL for Railway deployment if not set
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = 'https://backend-production-c6fe.up.railway.app';
}
// @ts-ignore
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  // standalone only for production Docker builds (see Dockerfile)
  // In dev it can interfere with Turbopack/HMR module resolution
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
