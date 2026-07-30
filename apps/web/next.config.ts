import type { NextConfig } from "next";

const sentryRelease =
  process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";
const uploadSentrySourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT &&
  sentryRelease,
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: uploadSentrySourceMaps,
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.everlane.com",
        pathname: "/cdn/shop/files/**",
      },
    ],
  },
  transpilePackages: [
    "@rober/api-client",
    "@rober/fit-engine",
    "@rober/matching",
    "@rober/ui",
  ],
};

export default nextConfig;
