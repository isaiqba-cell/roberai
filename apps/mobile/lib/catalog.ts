import {
  filterProducts,
  generateDemoCatalog,
  getDemoBrands,
  findJeansFitMatches,
  resolveFavoriteJeans,
  defaultFavoriteJeansInput,
  ProductFilters,
  ProductRecord,
} from "@rober/api-client";
import { ProductCardModel } from "../components/product";

export const demoCatalog = generateDemoCatalog();
export const demoBrands = getDemoBrands();

export function searchCatalog(filters: ProductFilters) {
  return filterProducts(demoCatalog, filters);
}

export function getCatalogProduct(id: string) {
  return demoCatalog.find((product) => product.id === id);
}

export function toProductCard(
  product: ProductRecord,
  fitConfidence?: number,
): ProductCardModel {
  const recommendedSize =
    product.variants.find((variant) => variant.stock > 0)?.sizeLabel ??
    product.variants[0]?.sizeLabel ??
    "29x32";
  return {
    id: product.id,
    brand: product.brand.name,
    title: product.title,
    priceCents: product.priceCents,
    ...(product.compareAtPriceCents
      ? { compareAtCents: product.compareAtPriceCents }
      : {}),
    imageUrl: product.heroImageUrl,
    ...(fitConfidence ? { fitConfidence } : {}),
    recommendedSize,
    explanation: `${product.brand.name} ${product.subcategory} normalized from ${product.brand.sizeChartConfidence} chart.`,
  };
}

export const jeansProducts = demoCatalog.filter(
  (product) => product.subcategory === "jeans",
);
export const featuredProducts = [
  ...jeansProducts,
].slice(0, 12);
export const newArrivalProducts = [
  ...jeansProducts.slice(1),
].slice(0, 12);
export const closetInspiredProducts = demoCatalog.filter((product) =>
  product.styleTags.some((tag) =>
    [
      "denim",
      "straight",
      "relaxed",
      "curvy",
      "utility",
      "business casual",
    ].includes(tag),
  ),
);

export const demoFavoriteJeans = resolveFavoriteJeans(
  defaultFavoriteJeansInput,
);
export const demoJeansMatches = findJeansFitMatches(defaultFavoriteJeansInput);
