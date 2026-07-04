import {
  filterProducts,
  generateDemoCatalog,
  getDemoBrands,
  ProductFilters,
  ProductRecord
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

export function toProductCard(product: ProductRecord, fitConfidence?: number): ProductCardModel {
  return {
    id: product.id,
    brand: product.brand.name,
    title: product.title,
    priceCents: product.priceCents,
    ...(product.compareAtPriceCents ? { compareAtCents: product.compareAtPriceCents } : {}),
    imageUrl: product.heroImageUrl,
    ...(fitConfidence ? { fitConfidence } : {}),
    recommendedSize: "M",
    explanation: `${product.brand.name} ${product.subcategory} normalized from ${product.brand.sizeChartConfidence} chart.`
  };
}

export const featuredProducts = demoCatalog.slice(0, 12);
export const newArrivalProducts = demoCatalog.slice(18, 30);
export const closetInspiredProducts = demoCatalog.filter((product) =>
  product.styleTags.some((tag) => ["utility", "denim", "business casual"].includes(tag))
);
