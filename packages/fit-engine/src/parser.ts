import { FitCategory, GarmentCut } from "./types";

export type ParsedSearchFilters = {
  category?: FitCategory | "jeans" | "boots";
  colors: string[];
  priceMin?: number;
  priceMax?: number;
  fitIntent?: GarmentCut;
  referenceItemHint?: string;
  materials: string[];
  styleTags: string[];
  sizeAvailabilityRequired: boolean;
};

const colors = ["green", "olive", "blue", "light blue", "black", "cream", "clay", "khaki", "brown", "navy"];
const materials = ["cotton", "denim", "linen", "wool", "leather", "knit", "nylon", "twill"];
const fitWords: Record<string, GarmentCut> = {
  slim: "slim",
  regular: "regular",
  relaxed: "relaxed",
  oversized: "oversized",
  wide: "relaxed"
};

export function parseNaturalLanguageSearch(query: string): ParsedSearchFilters {
  const normalized = query.toLowerCase();
  const priceUnder = normalized.match(/under\s+\$?(\d+)/);
  const between = normalized.match(/between\s+\$?(\d+)\s+(?:and|-)\s+\$?(\d+)/);
  const parsedColors = colors.filter((color) => normalized.includes(color));
  const parsedMaterials = materials.filter((material) => normalized.includes(material));
  const fitIntent = Object.entries(fitWords).find(([word]) => normalized.includes(word))?.[1];
  const category = inferCategory(normalized);

  return {
    ...(category ? { category } : {}),
    colors: parsedColors,
    ...(between ? { priceMin: Number(between[1]), priceMax: Number(between[2]) } : {}),
    ...(priceUnder ? { priceMax: Number(priceUnder[1]) } : {}),
    ...(fitIntent ? { fitIntent } : {}),
    ...(normalized.includes("favorite") ? { referenceItemHint: "favorite garment" } : {}),
    materials: parsedMaterials,
    styleTags: inferStyleTags(normalized),
    sizeAvailabilityRequired: true
  };
}

function inferCategory(query: string): ParsedSearchFilters["category"] | undefined {
  if (query.includes("jean")) {
    return "jeans";
  }
  if (query.includes("boot") || query.includes("shoe")) {
    return "boots";
  }
  if (query.includes("jacket") || query.includes("blazer") || query.includes("shell")) {
    return "outerwear";
  }
  if (query.includes("dress")) {
    return "dresses";
  }
  if (query.includes("shirt") || query.includes("overshirt") || query.includes("sweater") || query.includes("knit")) {
    return "tops";
  }
  return undefined;
}

function inferStyleTags(query: string) {
  return [
    query.includes("business casual") ? "business casual" : undefined,
    query.includes("summer") ? "summer office" : undefined,
    query.includes("party") ? "dinner" : undefined,
    query.includes("wide feet") ? "wide feet" : undefined,
    query.includes("casual") ? "casual" : undefined
  ].filter((tag): tag is string => Boolean(tag));
}
