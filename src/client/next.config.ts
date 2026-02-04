import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "www.bestbuy.com" },
      { protocol: "https", hostname: "www.dyson.com" },
      { protocol: "https", hostname: "store.hp.com" },
      { protocol: "https", hostname: "i1.adis.ws" },
      { protocol: "https", hostname: "i5.walmartimages.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "store.storeimages.cdn-apple.com" },
    ],
  },
};

export default nextConfig;
