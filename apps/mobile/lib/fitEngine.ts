import {
  BodyProfile,
  computeFitForVariants,
  computeFitScore,
  FavoriteReferenceItem,
  FitCategory,
  FitPreference,
  GarmentVariant,
  parseNaturalLanguageSearch
} from "@rober/fit-engine";
import { ProductFilters, ProductRecord } from "@rober/api-client";
import { ProductCardModel } from "../components/product";
import { searchCatalog } from "./catalog";

export type ProductFitSummary = {
  product: ProductRecord;
  card: ProductCardModel;
  confidence: number;
  recommendedSize: string;
  explanation: string[];
  dimensionScores: Record<string, number>;
};

export function compareProductsForQuery(query: string, body: BodyProfile, sliderValue: number, favorite?: FavoriteReferenceItem) {
  const parsed = parseNaturalLanguageSearch(query);
  const filters = parsedToProductFilters(query, parsed);
  const adjustedBody = {
    ...body,
    fitPreference: preferenceFromSlider(sliderValue, body.fitPreference)
  };

  return searchCatalog(filters)
    .map((product) => summarizeProductFit(product, adjustedBody, favorite))
    .sort((a, b) => b.confidence - a.confidence);
}

export function summarizeProductFit(product: ProductRecord, body: BodyProfile, favorite?: FavoriteReferenceItem): ProductFitSummary {
  const category = categoryForProduct(product.category);
  const variants: GarmentVariant[] = product.variants.map((variant) => ({
    id: variant.id,
    sizeLabel: variant.sizeLabel,
    spec: variant.spec,
    stock: variant.stock
  }));
  const fitOptions = {
    category,
    ...(favorite ? { favoriteReferenceItem: favorite } : {})
  };
  const [best] = computeFitForVariants(body, variants, fitOptions);
  const recommendedSize = best?.variant.sizeLabel ?? product.variants[0]?.sizeLabel ?? "OS";
  const result =
    best?.result ??
    computeFitScore(body, product.variants[0]?.spec ?? { stretchPct: 0, cut: "regular" }, {
      ...fitOptions,
      sizeLabel: recommendedSize
    });

  return {
    product,
    confidence: result.confidence,
    recommendedSize,
    explanation: result.explanation,
    dimensionScores: result.dimensionScores,
    card: {
      id: product.id,
      brand: product.brand.name,
      title: product.title,
      priceCents: product.priceCents,
      ...(product.compareAtPriceCents ? { compareAtCents: product.compareAtPriceCents } : {}),
      imageUrl: product.heroImageUrl,
      fitConfidence: result.confidence,
      recommendedSize,
      explanation: result.explanation[1] ?? result.explanation[0] ?? "Normalized chart compared to your profile."
    }
  };
}

function parsedToProductFilters(query: string, parsed: ReturnType<typeof parseNaturalLanguageSearch>): ProductFilters {
  const category = parsed.category === "jeans" ? "bottoms" : parsed.category === "boots" ? "shoes" : parsed.category;
  const subcategory = parsed.category === "jeans" ? "jeans" : parsed.category === "boots" ? "boots" : undefined;
  const colors = parsed.colors.flatMap((color) => (color === "green" ? ["olive", "forest"] : [color]));
  return {
    query: query.replace(/under\s+\$?\d+/i, "").replace(/between\s+\$?\d+\s+(?:and|-)\s+\$?\d+/i, "").trim(),
    ...(category ? { category } : {}),
    ...(subcategory ? { subcategory } : {}),
    ...(colors.length ? { colors } : {}),
    ...(parsed.materials.length ? { materials: parsed.materials } : {}),
    ...(parsed.fitIntent ? { fit: parsed.fitIntent } : {}),
    ...(parsed.priceMin ? { priceMin: parsed.priceMin } : {}),
    ...(parsed.priceMax ? { priceMax: parsed.priceMax } : {}),
    sizeAvailabilityRequired: true
  };
}

function categoryForProduct(category: ProductRecord["category"]): FitCategory {
  return category;
}

function preferenceFromSlider(value: number, fallback: FitPreference): FitPreference {
  if (value <= 25) {
    return "slim";
  }
  if (value <= 50) {
    return "regular";
  }
  if (value <= 75) {
    return "relaxed";
  }
  if (value <= 100) {
    return "oversized";
  }
  return fallback;
}
