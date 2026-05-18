import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.paypalobjects.com',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
