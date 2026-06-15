import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
