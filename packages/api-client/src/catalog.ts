import { CanonicalGarmentSpec, GarmentCut, GarmentSpec } from "@rober/fit-engine";
import { generateJeansCatalogProducts, jeansBrands } from "./jeans";

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  positioning: string;
  sizeChartConfidence: "verified" | "ai_normalized" | "unverified";
};

export type ProductCategory =
  "tops" | "bottoms" | "outerwear" | "dresses" | "shoes" | "accessories";

export type ProductVariantRecord = {
  id: string;
  productId: string;
  sizeLabel: string;
  color: string;
  sku: string;
  stock: number;
  priceCents: number;
  spec: CanonicalGarmentSpec;
  garmentSpec?: GarmentSpec;
};

export type ProductRecord = {
  id: string;
  merchantName: string;
  brand: BrandRecord;
  title: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  material: string;
  colors: string[];
  styleTags: string[];
  fitTags: string[];
  priceCents: number;
  compareAtPriceCents?: number;
  currency: "USD";
  heroImageUrl: string;
  galleryImageUrls?: string[];
  rating: number;
  reviewCount: number;
  variants: ProductVariantRecord[];
  createdAt: string;
  sizeChartSourceUrl?: string;
  sizeChartSourceName?: string;
  sourceDataQuality?:
    "scraped_official" | "fit_model_normalized" | "seeded_synthetic";
};

export type ProductFilters = {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  colors?: string[];
  fit?: GarmentCut;
  materials?: string[];
  brands?: string[];
  styleTags?: string[];
  priceMin?: number;
  priceMax?: number;
  sizeAvailabilityRequired?: boolean;
};

const queryStopWords = new Set([
  "and",
  "are",
  "between",
  "every",
  "favorite",
  "fit",
  "fits",
  "for",
  "from",
  "jean",
  "jeans",
  "like",
  "matching",
  "pair",
  "that",
  "the",
  "under",
  "with",
  "your",
]);

type ProductArchetype = {
  slug: string;
  title: string;
  category: ProductCategory;
  subcategory: string;
  material: string;
  colors: string[];
  styleTags: string[];
  fitTags: string[];
  basePriceCents: number;
  cut: GarmentCut;
  stretchPct: number;
  imageUrl: string;
};

const brands: BrandRecord[] = [
  {
    id: "brand-fieldstone",
    name: "Fieldstone Supply Co.",
    slug: "fieldstone",
    positioning: "Warm utility basics with verified charts.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-northgate",
    name: "Northgate Denim",
    slug: "northgate",
    positioning: "Rigid denim and clean western shirting.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-wescott",
    name: "Wescott & Vale",
    slug: "wescott",
    positioning: "Soft office tailoring with generous shoulders.",
    sizeChartConfidence: "ai_normalized",
  },
  {
    id: "brand-alder",
    name: "Alder & Thread",
    slug: "alder",
    positioning: "Natural fibers and relaxed weekend shapes.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-marlowe",
    name: "Marlowe Studio",
    slug: "marlowe",
    positioning: "Design-forward silhouettes with cropped proportions.",
    sizeChartConfidence: "ai_normalized",
  },
  {
    id: "brand-finch",
    name: "Finch Athletics",
    slug: "finch",
    positioning: "Performance stretch pieces for wide motion ranges.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-rowan",
    name: "Rowan Utility",
    slug: "rowan",
    positioning: "Workwear-inspired layers with roomy ease.",
    sizeChartConfidence: "unverified",
  },
  {
    id: "brand-harbor",
    name: "Harbor Knitworks",
    slug: "harbor",
    positioning: "Soft knits, warm neutrals, and textured staples.",
    sizeChartConfidence: "ai_normalized",
  },
];

const archetypes: ProductArchetype[] = [
  {
    slug: "overshirt",
    title: "Washed Cotton Utility Overshirt",
    category: "tops",
    subcategory: "overshirt",
    material: "cotton twill",
    colors: ["clay", "olive"],
    styleTags: ["utility", "weekend", "layering"],
    fitTags: ["relaxed"],
    basePriceCents: 7800,
    cut: "relaxed",
    stretchPct: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "denim-shirt",
    title: "Rigid Denim Camp Shirt",
    category: "tops",
    subcategory: "shirt",
    material: "denim",
    colors: ["light blue", "indigo"],
    styleTags: ["denim", "casual", "western"],
    fitTags: ["regular"],
    basePriceCents: 8800,
    cut: "regular",
    stretchPct: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "linen-shirt",
    title: "Open-Weave Linen Shirt",
    category: "tops",
    subcategory: "shirt",
    material: "linen",
    colors: ["cream", "sage"],
    styleTags: ["summer office", "minimal", "breathable"],
    fitTags: ["regular"],
    basePriceCents: 9200,
    cut: "regular",
    stretchPct: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "straight-jeans",
    title: "Regular Straight Selvedge Jean",
    category: "bottoms",
    subcategory: "jeans",
    material: "cotton denim",
    colors: ["light blue", "washed black"],
    styleTags: ["denim", "casual", "everyday"],
    fitTags: ["regular"],
    basePriceCents: 11800,
    cut: "regular",
    stretchPct: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "wide-chino",
    title: "Wide-Leg Cotton Chino",
    category: "bottoms",
    subcategory: "chino",
    material: "cotton",
    colors: ["khaki", "black"],
    styleTags: ["business casual", "utility", "travel"],
    fitTags: ["relaxed"],
    basePriceCents: 9600,
    cut: "relaxed",
    stretchPct: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "knit-sweater",
    title: "Textured Cotton Knit Sweater",
    category: "tops",
    subcategory: "sweater",
    material: "cotton knit",
    colors: ["blue", "cream"],
    styleTags: ["knit", "soft", "weekend"],
    fitTags: ["oversized"],
    basePriceCents: 7400,
    cut: "oversized",
    stretchPct: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "summer-blazer",
    title: "Unlined Summer Blazer",
    category: "outerwear",
    subcategory: "blazer",
    material: "linen cotton",
    colors: ["navy", "sand"],
    styleTags: ["business casual", "summer office", "tailoring"],
    fitTags: ["regular"],
    basePriceCents: 16800,
    cut: "regular",
    stretchPct: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "rain-shell",
    title: "Packable City Rain Shell",
    category: "outerwear",
    subcategory: "jacket",
    material: "recycled nylon",
    colors: ["black", "forest"],
    styleTags: ["travel", "utility", "weather"],
    fitTags: ["relaxed"],
    basePriceCents: 13800,
    cut: "relaxed",
    stretchPct: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "rib-dress",
    title: "Ribbed Column Dress",
    category: "dresses",
    subcategory: "dress",
    material: "rib knit",
    colors: ["black", "cocoa"],
    styleTags: ["minimal", "soft tailoring", "dinner"],
    fitTags: ["slim"],
    basePriceCents: 11200,
    cut: "slim",
    stretchPct: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "wide-boot",
    title: "Wide-Fit Leather Chelsea Boot",
    category: "shoes",
    subcategory: "boots",
    material: "leather",
    colors: ["black", "brown"],
    styleTags: ["wide feet", "work", "weather"],
    fitTags: ["regular"],
    basePriceCents: 18400,
    cut: "regular",
    stretchPct: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "jogger",
    title: "Stretch Transit Jogger",
    category: "bottoms",
    subcategory: "jogger",
    material: "stretch twill",
    colors: ["charcoal", "olive"],
    styleTags: ["athletic", "travel", "weekend"],
    fitTags: ["relaxed"],
    basePriceCents: 8200,
    cut: "relaxed",
    stretchPct: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "belt-bag",
    title: "Compact Crossbody Belt Bag",
    category: "accessories",
    subcategory: "bag",
    material: "recycled nylon",
    colors: ["black", "clay"],
    styleTags: ["travel", "utility", "everyday"],
    fitTags: ["regular"],
    basePriceCents: 5800,
    cut: "regular",
    stretchPct: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
  },
];

const brandSizeOffsets: Record<string, number> = {
  fieldstone: 3,
  northgate: 0,
  wescott: 4,
  alder: 2,
  marlowe: -3,
  finch: 1,
  rowan: 6,
  harbor: 5,
};

const createdAt = "2026-07-04T00:00:00.000Z";

export function getDemoBrands(): BrandRecord[] {
  return jeansBrands;
}

export function generateDemoCatalog(): ProductRecord[] {
  return generateJeansCatalogProducts();
}

function generateSyntheticCatalog(): ProductRecord[] {
  const syntheticProducts: ProductRecord[] = brands.flatMap(
    (brand, brandIndex) =>
      archetypes.map((archetype, archetypeIndex) => {
        const color =
          archetype.colors[
            (brandIndex + archetypeIndex) % archetype.colors.length
          ] ??
          archetype.colors[0] ??
          "black";
        const brandShortName = brand.name.split(" ")[0] ?? brand.name;
        const id = `${brand.slug}-${archetype.slug}-${slugify(color)}`;
        const priceCents =
          archetype.basePriceCents +
          brandIndex * 450 +
          (archetypeIndex % 3) * 600;
        return {
          id,
          merchantName: `${brand.name} Direct`,
          brand,
          title: `${brandShortName} ${archetype.title}`,
          description: `${brand.positioning} This ${archetype.subcategory} is normalized into Rober's canonical fit model for cross-brand comparison.`,
          category: archetype.category,
          subcategory: archetype.subcategory,
          material: archetype.material,
          colors: [color],
          styleTags: archetype.styleTags,
          fitTags: archetype.fitTags,
          priceCents,
          ...(archetypeIndex % 4 === 0
            ? { compareAtPriceCents: priceCents + 2200 }
            : {}),
          currency: "USD",
          heroImageUrl: archetype.imageUrl,
          rating: 4.2 + ((brandIndex + archetypeIndex) % 7) / 10,
          reviewCount: 38 + brandIndex * 18 + archetypeIndex * 7,
          variants: buildVariants(id, brand.slug, color, priceCents, archetype),
          createdAt,
        };
      }),
  );
  return syntheticProducts;
}

export function filterProducts(
  products: ProductRecord[],
  filters: ProductFilters,
): ProductRecord[] {
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const queryTokens = normalizedQuery
    ?.split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !queryStopWords.has(token));
  return products.filter((product) => {
    const searchable = [
      product.title,
      product.brand.name,
      product.category,
      product.subcategory,
      product.material,
      product.colors.join(" "),
      product.styleTags.join(" "),
      product.fitTags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      !queryTokens?.length ||
      queryTokens.every((token) => searchable.includes(token));
    const matchesCategory =
      !filters.category || product.category === filters.category;
    const matchesSubcategory =
      !filters.subcategory || product.subcategory === filters.subcategory;
    const matchesColor =
      !filters.colors?.length ||
      product.colors.some((color) => filters.colors?.includes(color));
    const matchesMaterial =
      !filters.materials?.length ||
      filters.materials.some((material) => product.material.includes(material));
    const matchesBrand =
      !filters.brands?.length || filters.brands.includes(product.brand.slug);
    const matchesStyle =
      !filters.styleTags?.length ||
      filters.styleTags.some(
        (tag) =>
          product.styleTags.includes(tag) || product.fitTags.includes(tag),
      );
    const matchesPriceMin =
      !filters.priceMin || product.priceCents >= filters.priceMin * 100;
    const matchesPriceMax =
      !filters.priceMax || product.priceCents <= filters.priceMax * 100;
    const matchesFit =
      !filters.fit ||
      product.variants.some((variant) => variant.spec.cut === filters.fit);
    const matchesAvailability =
      !filters.sizeAvailabilityRequired ||
      product.variants.some((variant) => variant.stock > 0);

    return (
      matchesQuery &&
      matchesCategory &&
      matchesSubcategory &&
      matchesColor &&
      matchesMaterial &&
      matchesBrand &&
      matchesStyle &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesFit &&
      matchesAvailability
    );
  });
}

export function getProductById(id: string, products = generateDemoCatalog()) {
  return products.find((product) => product.id === id);
}

function buildVariants(
  productId: string,
  brandSlug: string,
  color: string,
  priceCents: number,
  archetype: ProductArchetype,
): ProductVariantRecord[] {
  const offset = brandSizeOffsets[brandSlug] ?? 0;
  if (archetype.category === "shoes") {
    return [8, 9, 10, 10.5, 11, 12].map((size, index) => ({
      id: `${productId}-${String(size).replace(".", "-")}`,
      productId,
      sizeLabel: String(size),
      color,
      sku: `${productId}-${size}`,
      stock: index === 0 ? 0 : 18 + index * 4,
      priceCents,
      spec: {
        shoeSizeUs: size,
        stretchPct: archetype.stretchPct,
        cut: archetype.cut,
      },
    }));
  }

  const sizeLabels =
    archetype.category === "bottoms"
      ? ["28", "30", "32", "34", "36", "38"]
      : ["XS", "S", "M", "L", "XL", "XXL"];
  return sizeLabels.map((sizeLabel, index) => ({
    id: `${productId}-${sizeLabel.toLowerCase()}`,
    productId,
    sizeLabel,
    color,
    sku: `${productId}-${sizeLabel}`,
    stock: index === 0 && brandSlug === "marlowe" ? 0 : 22 + index * 5,
    priceCents,
    spec: specForSize(archetype, sizeLabel, index, offset),
  }));
}

function specForSize(
  archetype: ProductArchetype,
  sizeLabel: string,
  index: number,
  offset: number,
): CanonicalGarmentSpec {
  if (archetype.category === "bottoms") {
    const waist = Number(sizeLabel) * 2.54;
    const hip = waist + 15 + offset * 0.6;
    return {
      waistMinCm: round(waist - 2 + offset * 0.3),
      waistMaxCm: round(waist + 2 + offset * 0.3),
      hipMinCm: round(hip - 3),
      hipMaxCm: round(hip + 3),
      inseamCm: index % 2 === 0 ? 81 : 83,
      stretchPct: archetype.stretchPct,
      cut: archetype.cut,
    };
  }

  if (archetype.category === "accessories") {
    return {
      waistMinCm: 62,
      waistMaxCm: 126,
      stretchPct: archetype.stretchPct,
      cut: archetype.cut,
    };
  }

  const baseChest = 84 + index * 8 + offset;
  const baseWaist = 78 + index * 7 + offset * 0.7;
  const ease =
    archetype.category === "outerwear"
      ? 6
      : archetype.cut === "oversized"
        ? 8
        : 3;
  const spec: CanonicalGarmentSpec = {
    chestMinCm: round(baseChest + ease),
    chestMaxCm: round(baseChest + ease + 6),
    waistMinCm: round(baseWaist + ease),
    waistMaxCm: round(baseWaist + ease + 7),
    shoulderCm: round(39 + index * 2 + offset * 0.2),
    stretchPct: archetype.stretchPct,
    cut: archetype.cut,
  };
  if (archetype.category === "dresses") {
    spec.hipMinCm = round(baseWaist + 8);
    spec.hipMaxCm = round(baseWaist + 16);
  }
  return spec;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
