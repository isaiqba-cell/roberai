import "server-only";

import {
  generateJeansCatalogProducts,
  jeansBrands,
  jeansSizeChartSources,
} from "@rober/api-client";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMatchingCatalog } from "./matching-catalog";

export type CatalogIndexStatus = {
  mode: "live" | "seed";
  brands: number;
  chartSources: number;
  products: number;
  variants: number;
};

function seedStatus(): CatalogIndexStatus {
  const products = generateJeansCatalogProducts();
  return {
    mode: "seed",
    brands: jeansBrands.length,
    chartSources: jeansSizeChartSources.length,
    products: products.length,
    variants: products.reduce(
      (total, product) => total + product.variants.length,
      0,
    ),
  };
}

export async function getCatalogIndexStatus(): Promise<CatalogIndexStatus> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return seedStatus();
  }

  const [catalog, chartSources] = await Promise.all([
    getMatchingCatalog(),
    supabase.from("size_chart_sources").select("source_url").limit(1_000),
  ]);

  if (chartSources.error) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The published catalog index could not be read.");
    }
    return seedStatus();
  }

  return {
    mode: catalog.mode,
    brands: catalog.counts.brands,
    chartSources: new Set(
      (chartSources.data ?? []).map(({ source_url }) => source_url),
    ).size,
    products: catalog.counts.products,
    variants: catalog.counts.variants,
  };
}
