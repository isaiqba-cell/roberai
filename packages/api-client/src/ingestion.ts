import { NormalizedSizeChartEntry, normalizeInchesToCentimeters } from "@rober/fit-engine";
import { ProductRecord, generateDemoCatalog } from "./catalog";

export type CatalogProviderKind = "manual_seed" | "csv" | "shopify" | "mock_shopify";

export interface CatalogProvider {
  kind: CatalogProviderKind;
  fetchProducts(): Promise<ProductRecord[]>;
}

export class ManualSeedProvider implements CatalogProvider {
  kind = "manual_seed" as const;

  async fetchProducts() {
    return generateDemoCatalog();
  }
}

export class CsvCatalogProvider implements CatalogProvider {
  kind = "csv" as const;

  constructor(private readonly rows: ProductRecord[]) {}

  async fetchProducts() {
    return this.rows;
  }
}

export class MockShopifyCatalogProvider implements CatalogProvider {
  kind = "mock_shopify" as const;

  async fetchProducts() {
    return generateDemoCatalog().slice(0, 24);
  }
}

export class ShopifyCatalogProvider implements CatalogProvider {
  kind = "shopify" as const;

  constructor(
    private readonly config: {
      shopDomain?: string;
      storefrontToken?: string;
      adminToken?: string;
    }
  ) {}

  async fetchProducts() {
    if (!this.config.shopDomain || !this.config.storefrontToken) {
      return new MockShopifyCatalogProvider().fetchProducts();
    }
    throw new Error("Live Shopify ingestion is intentionally not run in demo mode.");
  }
}

export function normalizeRawSizeChartFallback(raw: string): NormalizedSizeChartEntry[] {
  const rows = raw
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);
  const entries: NormalizedSizeChartEntry[] = [];
  rows.forEach((row) => {
    const size = row.match(/\b(XS|S|M|L|XL|XXL|\d{2})\b/i)?.[1]?.toUpperCase();
    const chest = row.match(/chest\s*(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
    const waist = row.match(/waist\s*(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
    const hip = row.match(/hip\s*(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i);
    const inches = /\bin\b|inch|inches/i.test(row);
    if (!size) {
      return;
    }
    entries.push({
      sizeLabel: size,
      canonicalSpec: {
        ...(chest
          ? {
              chestMinCm: convert(Number(chest[1]), inches),
              chestMaxCm: convert(Number(chest[2]), inches)
            }
          : {}),
        ...(waist
          ? {
              waistMinCm: convert(Number(waist[1]), inches),
              waistMaxCm: convert(Number(waist[2]), inches)
            }
          : {}),
        ...(hip
          ? {
              hipMinCm: convert(Number(hip[1]), inches),
              hipMaxCm: convert(Number(hip[2]), inches)
            }
          : {}),
        stretchPct: /stretch|elastane|spandex/i.test(row) ? 6 : 2,
        cut: /oversized/i.test(row) ? "oversized" : /relaxed/i.test(row) ? "relaxed" : /slim/i.test(row) ? "slim" : "regular"
      },
      sourceNotes: "Deterministic fallback normalization; requires human approval."
    });
  });
  return entries;
}

function convert(value: number, inches: boolean) {
  return inches ? normalizeInchesToCentimeters(value) : value;
}
