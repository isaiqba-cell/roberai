import type { MetadataRoute } from "next";

import { getPublicCatalogBrands } from "@/lib/catalog/public-brand";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rober.ai").replace(
    /\/$/,
    "",
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const brands = await getPublicCatalogBrands();
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/brands`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...brands.map((brand) => ({
      url: `${base}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
