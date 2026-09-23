import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https', hostname: 'images.unsplash.com'
      }
    ]
  }
};

export default nextConfig;


