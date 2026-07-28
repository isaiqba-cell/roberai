import "server-only";

import {
  generateJeansCatalogProducts,
  jeansBrands,
  jeansSizeChartSources,
} from "@rober/api-client";

import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const [brands, chartSources, products, variants] = await Promise.all([
    supabase.from("brands").select("id", { count: "exact" }).limit(1),
    supabase
      .from("size_chart_sources")
      .select("id", { count: "exact" })
      .limit(1),
    supabase.from("products").select("id", { count: "exact" }).limit(1),
    supabase.from("product_variants").select("id", { count: "exact" }).limit(1),
  ]);

  if (brands.error || chartSources.error || products.error || variants.error) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The published catalog index could not be read.");
    }
    return seedStatus();
  }

  return {
    mode: "live",
    brands: brands.count ?? 0,
    chartSources: chartSources.count ?? 0,
    products: products.count ?? 0,
    variants: variants.count ?? 0,
  };
}
