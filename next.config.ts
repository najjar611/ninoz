import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/waitlist',
        destination: '/foundingmams',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
