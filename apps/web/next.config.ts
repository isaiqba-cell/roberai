import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@rober/api-client",
    "@rober/fit-engine",
    "@rober/matching",
    "@rober/ui",
  ],
};

export default nextConfig;
