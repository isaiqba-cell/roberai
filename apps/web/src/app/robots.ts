import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rober.ai").replace(
    /\/$/,
    "",
  );
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/brands/", "/privacy", "/terms"],
      disallow: ["/admin", "/api/", "/account", "/saved"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
