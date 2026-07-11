import type { NextConfig } from "next";

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
