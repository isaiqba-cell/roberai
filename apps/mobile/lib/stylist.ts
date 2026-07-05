import { parseNaturalLanguageSearch } from "@rober/fit-engine";
import { BodyProfile } from "@rober/fit-engine";
import { StyleProfile, KnownGoodItem } from "../stores/useDemoStore";
import { compareProductsForQuery, ProductFitSummary } from "./fitEngine";

export type StylistResponse = {
  text: string;
  products: ProductFitSummary[];
  parsedChips: string[];
};

export function getGroundedStylistResponse({
  query,
  body,
  style,
  favoriteItems,
  wishlistIds
}: {
  query: string;
  body: BodyProfile;
  style: StyleProfile;
  favoriteItems: KnownGoodItem[];
  wishlistIds: string[];
}): StylistResponse {
  const parsed = parseNaturalLanguageSearch(query);
  const favorite = favoriteItems[0];
  const products = compareProductsForQuery(
    query,
    body,
    body.fitPreference === "slim" ? 25 : body.fitPreference === "regular" ? 45 : body.fitPreference === "relaxed" ? 65 : 85,
    favorite
      ? {
          itemName: favorite.itemName,
          category: favorite.category,
          sizeLabel: favorite.sizeLabel,
          fitNotes: favorite.fitNotes,
          measurements: favorite.measurements
        }
      : undefined
  ).slice(0, 4);
  const chips = [
    parsed.category ? formatChipLabel(parsed.category) : undefined,
    ...parsed.colors.map(formatChipLabel),
    ...parsed.materials.map(formatChipLabel),
    parsed.fitIntent ? `${formatChipLabel(parsed.fitIntent)} fit` : undefined,
    parsed.priceMax ? `Under $${parsed.priceMax}` : undefined
  ].filter((chip): chip is string => Boolean(chip));

  if (!products.length) {
    return {
      text: `I could not find a grounded catalog match for "${query}". Try straight jeans, curvy jeans, relaxed denim, rigid denim, or a lower number of constraints.`,
      products: [],
      parsedChips: chips
    };
  }

  const best = products[0]!;
  const savedContext = products.some((product) => wishlistIds.includes(product.product.id))
    ? " One result is already in your saved list."
    : "";
  return {
    text: `I found ${products.length} catalog-backed option${products.length === 1 ? "" : "s"}. Best match: ${best.product.brand.name} in ${best.recommendedSize} with ${best.confidence}% fit confidence. It lines up with your ${body.fitPreference} preference and ${style.styleTags.slice(0, 2).join(" / ")} style memory.${savedContext}`,
    products,
    parsedChips: chips
  };
}

function formatChipLabel(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
