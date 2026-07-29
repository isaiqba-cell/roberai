import "server-only";

import { jeansSizeChartSources } from "@rober/api-client";

import { getMatchingCatalog } from "@/lib/catalog/matching-catalog";
import {
  getReferenceBrands,
  getReferenceModels,
} from "@/lib/reference/server";
import type { ReferenceBrandOption } from "@/lib/reference/types";

export type PublicBrandProduct = {
  id: string;
  title: string;
  imageUrl: string;
  priceCents: number;
  sizeCount: number;
  fitFamilies: string[];
  sourceLabel: string;
};

const sourceBrandNames = new Map(
  jeansSizeChartSources.map((source) => [source.brandSlug, source.brandName]),
);

function mergePublicBrands(
  references: ReferenceBrandOption[],
  products: Awaited<ReturnType<typeof getMatchingCatalog>>["products"],
) {
  const brands = new Map(
    references.map((brand) => [
      brand.slug,
      { ...brand, catalogModels: new Set<string>() },
    ]),
  );

  products.forEach((product) => {
    const current = brands.get(product.brand.slug) ?? {
      slug: product.brand.slug,
      name:
        sourceBrandNames.get(product.brand.slug) ?? product.brand.name,
      indexed: true,
      modelCount: 0,
      catalogModels: new Set<string>(),
    };
    current.catalogModels.add(product.title);
    brands.set(product.brand.slug, current);
  });

  return [...brands.values()]
    .map(({ catalogModels, ...brand }) => ({
      ...brand,
      modelCount: Math.max(brand.modelCount, catalogModels.size),
    }))
    .sort((left, right) =>
      left.slug === "levis"
        ? -1
        : right.slug === "levis"
          ? 1
          : left.name.localeCompare(right.name),
    );
}

export async function getPublicCatalogBrands() {
  const [references, catalog] = await Promise.all([
    getReferenceBrands(),
    getMatchingCatalog(),
  ]);
  return mergePublicBrands(references, catalog.products);
}

export async function getPublicBrand(slug: string) {
  const [brands, models, catalog] = await Promise.all([
    getReferenceBrands(),
    getReferenceModels(slug),
    getMatchingCatalog(),
  ]);
  const publicBrands = mergePublicBrands(brands, catalog.products);
  const brand =
    publicBrands.find((candidate) => candidate.slug === slug) ?? null;
  const brandCatalogProducts = catalog.products.filter(
    (product) => product.brand.slug === slug,
  );
  const products: PublicBrandProduct[] = brandCatalogProducts
    .map((product) => ({
      id: product.id,
      title: product.title,
      imageUrl: product.heroImageUrl,
      priceCents: product.priceCents,
      sizeCount: product.variants.length,
      fitFamilies: product.fitTags,
      sourceLabel: product.provenance.label,
    }));

  const referenceModels = models.length
    ? models
    : brandCatalogProducts.map((product) => ({
        name: product.title,
        sizes: product.variants.map((variant) => variant.sizeLabel),
      }));

  return {
    brand,
    models: referenceModels,
    products,
    allBrands: publicBrands,
    catalogMode: catalog.mode,
  };
}
