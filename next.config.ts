import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev-mode route indicator (the "N" button). Dev-only.
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/waitlist',
        destination: '/foundingmamas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
