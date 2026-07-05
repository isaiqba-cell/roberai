import type {
  BrandRecord,
  ProductRecord,
  ProductVariantRecord,
} from "./catalog";

export type JeansGender = "women" | "men";

export type JeansSizeChartSource = {
  id: string;
  brandName: string;
  brandSlug: string;
  gender: JeansGender;
  sourceUrl: string;
  scrapedAt: string;
  sourceNote: string;
};

export type JeansSizeChartEntry = {
  sourceId: string;
  brandName: string;
  brandSlug: string;
  gender: JeansGender;
  sizeLabel: string;
  waistCm: number;
  hipCm: number;
  inseamOptionsCm: number[];
  waistIn: number;
  hipIn: number;
};

export type FavoriteJeansInput = {
  brandSlug: string;
  sizeLabel: string;
  inseamIn?: number;
};

export type FavoriteJeansProfile = {
  brandName: string;
  brandSlug: string;
  sizeLabel: string;
  waistCm: number;
  hipCm: number;
  inseamCm: number;
  sourceUrl: string;
};

export type JeansFitMatch = {
  brandName: string;
  brandSlug: string;
  sizeLabel: string;
  sizeToBuy: string;
  waistCm: number;
  hipCm: number;
  inseamCm: number;
  fitScore: number;
  priceCents: number;
  productId: string;
  productTitle: string;
  sourceUrl: string;
  note: string;
};

const scrapedAt = "2026-07-04";
const inch = 2.54;
const imagePath = (fileName: string) => `/images/jeans/${fileName}`;

export const jeansBrands: BrandRecord[] = [
  {
    id: "brand-madewell",
    name: "Marlow Denim",
    slug: "madewell",
    positioning: "Premium denim inspired by detailed waist and hip charts.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-lee",
    name: "Loom & Line",
    slug: "lee",
    positioning:
      "Heritage denim inspired by explicit waist, low-hip, and inseam charts.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-wrangler",
    name: "Range Standard",
    slug: "wrangler",
    positioning:
      "Workwear denim inspired by detailed waist, seat, thigh, and length charts.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-old-navy",
    name: "Harbor Denim",
    slug: "old-navy",
    positioning:
      "Accessible denim price points inspired by regular, petite, and tall size charts.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-american-eagle",
    name: "Alder Curve",
    slug: "american-eagle",
    positioning:
      "Stretch and curvy denim fit model with extra hip and thigh room.",
    sizeChartConfidence: "ai_normalized",
  },
];

export const jeansSizeChartSources: JeansSizeChartSource[] = [
  {
    id: "madewell-women-denim",
    brandName: "Madewell",
    brandSlug: "madewell",
    gender: "women",
    sourceUrl: "https://www.madewell.com/Denim-SizeChart.html",
    scrapedAt,
    sourceNote:
      "Official women's denim chart with waist and hip by numeric denim size.",
  },
  {
    id: "madewell-men-bottoms",
    brandName: "Madewell",
    brandSlug: "madewell",
    gender: "men",
    sourceUrl: "https://www.madewell.com/Mens-Bottoms-SizeChart.html",
    scrapedAt,
    sourceNote:
      "Official men's bottoms chart with alpha and numeric waist conversions.",
  },
  {
    id: "lee-men-jeans",
    brandName: "Lee",
    brandSlug: "lee",
    gender: "men",
    sourceUrl: "https://eu.lee.com/uk-en/size-chart.html",
    scrapedAt,
    sourceNote: "Official men's jeans chart with waist, low hip, and inseam.",
  },
  {
    id: "lee-women-jeans",
    brandName: "Lee",
    brandSlug: "lee",
    gender: "women",
    sourceUrl: "https://eu.lee.com/uk-en/LEE-SIZECHART-BOTTOMS-WOMEN.html",
    scrapedAt,
    sourceNote:
      "Official women's jeans chart with natural waist, low waist, seat, thigh, and inseam.",
  },
  {
    id: "wrangler-men-jeans",
    brandName: "Wrangler",
    brandSlug: "wrangler",
    gender: "men",
    sourceUrl: "https://eu.wrangler.com/uk-en/WRG-SIZECHART-BOTTOMS-MEN.html",
    scrapedAt,
    sourceNote:
      "Official men's jeans chart with natural waist, low waist, seat, thigh, and length.",
  },
  {
    id: "old-navy-women-bottoms",
    brandName: "Old Navy",
    brandSlug: "old-navy",
    gender: "women",
    sourceUrl:
      "https://oldnavy.gap.com/Asset_Archive/AllBrands/sizeChart/v3/division-chart.html?division=women",
    scrapedAt,
    sourceNote:
      "Official women's bottoms chart with waist and hips/butt measurements.",
  },
  {
    id: "american-eagle-curvy-fit",
    brandName: "American Eagle",
    brandSlug: "american-eagle",
    gender: "women",
    sourceUrl:
      "https://blog.ae.com/2019/04/25/curvy-jeans-faq-by-you-answered-by-us/",
    scrapedAt,
    sourceNote:
      "Official fit note: AE curvy jeans use a larger hip-to-waist difference than classic fits.",
  },
];

export const jeansSizeChartEntries: JeansSizeChartEntry[] = [
  ...womenEntries("madewell-women-denim", "Madewell", "madewell", [
    ["24", 63.5, 89],
    ["25", 66, 91.5],
    ["26", 68.5, 94],
    ["27", 71, 96.5],
    ["28", 73.5, 99],
    ["29", 77, 102],
    ["30", 80, 105.5],
    ["31", 84, 109],
    ["32", 87.6, 113],
    ["33", 92, 117.5],
  ]),
  ...womenEntries("lee-women-jeans", "Lee", "lee", [
    ["24", 63.5, 86.5],
    ["25", 66, 89],
    ["26", 68.5, 91.5],
    ["27", 71, 94],
    ["28", 73.5, 96.5],
    ["29", 76, 99],
    ["30", 78.5, 101.5],
    ["31", 81.5, 104],
    ["32", 84, 106.5],
    ["33", 87, 109],
    ["34", 90, 112],
  ]),
  ...womenEntries("old-navy-women-bottoms", "Old Navy", "old-navy", [
    ["24", 61, 88],
    ["25", 64, 90],
    ["26", 66, 93],
    ["27", 69, 95],
    ["28", 71, 98],
    ["29", 74, 101],
    ["30", 76, 103],
    ["31.5", 80, 107],
    ["33.5", 85, 112],
    ["36.25", 92, 118],
  ]),
  ...aeCurvyEntries(),
  ...menEntries("lee-men-jeans", "Lee", "lee", [
    ["28", 71.5, 86.5],
    ["29", 74, 89],
    ["30", 76.5, 91.5],
    ["31", 79, 94],
    ["32", 81.5, 96.5],
    ["33", 84, 99.5],
    ["34", 86.5, 102],
    ["36", 91.5, 107],
    ["38", 96.5, 110.5],
    ["40", 102, 114],
  ]),
  ...menEntries("wrangler-men-jeans", "Wrangler", "wrangler", [
    ["28", 72.5, 86.5],
    ["29", 75, 89],
    ["30", 77.5, 91.5],
    ["31", 80, 94],
    ["32", 82.5, 96.5],
    ["33", 85, 99],
    ["34", 87.5, 101.5],
    ["36", 94, 105.5],
    ["38", 100.5, 109],
    ["40", 105.5, 113],
  ]),
  ...menEntries("madewell-men-bottoms", "Madewell", "madewell", [
    ["28", 71, 86],
    ["29", 74, 89],
    ["30", 76, 91.5],
    ["31", 79, 94],
    ["32", 81, 96.5],
    ["33", 84, 99],
    ["34", 86, 101.5],
    ["36", 91, 106.5],
    ["38", 97, 111.5],
    ["40", 102, 117],
  ]),
];

const jeansProductDefinitions = [
  {
    id: "madewell-perfect-vintage-straight",
    brandSlug: "madewell",
    sourceId: "madewell-women-denim",
    gender: "women" as const,
    title: "Perfect Vintage Straight Jean",
    cut: "regular" as const,
    fitTags: ["straight", "regular"],
    styleTags: ["denim", "straight", "premium", "everyday"],
    colors: ["light blue"],
    priceCents: 13800,
    stretchPct: 2,
    imageUrl: imagePath("apc-elisabeth.webp"),
    galleryImageUrls: [
      imagePath("apc-elisabeth.webp"),
      imagePath("agolde-straight.jpg"),
      imagePath("dark-slide.webp"),
    ],
  },
  {
    id: "lee-rider-loose-straight",
    brandSlug: "lee",
    sourceId: "lee-women-jeans",
    gender: "women" as const,
    title: "Rider Loose Straight Jean",
    cut: "relaxed" as const,
    fitTags: ["relaxed", "straight"],
    styleTags: ["denim", "relaxed", "heritage", "everyday"],
    colors: ["medium wash"],
    priceCents: 8900,
    stretchPct: 1,
    imageUrl: imagePath("straight-crop.jpeg"),
    galleryImageUrls: [
      imagePath("straight-crop.jpeg"),
      imagePath("straight-flat.jpeg"),
      imagePath("vintage-hanger.jpg"),
    ],
  },
  {
    id: "old-navy-high-waisted-straight",
    brandSlug: "old-navy",
    sourceId: "old-navy-women-bottoms",
    gender: "women" as const,
    title: "High-Waisted Straight Jean",
    cut: "regular" as const,
    fitTags: ["straight", "budget"],
    styleTags: ["denim", "budget", "everyday"],
    colors: ["dark wash"],
    priceCents: 4999,
    stretchPct: 4,
    imageUrl: imagePath("straight-flat.jpeg"),
    galleryImageUrls: [
      imagePath("straight-flat.jpeg"),
      imagePath("light-packshot.webp"),
      imagePath("basile-light.jpg"),
    ],
  },
  {
    id: "ae-curvy-straight",
    brandSlug: "american-eagle",
    sourceId: "american-eagle-curvy-fit",
    gender: "women" as const,
    title: "Curvy Straight Jean",
    cut: "relaxed" as const,
    fitTags: ["curvy", "straight", "stretch"],
    styleTags: ["denim", "curvy", "stretch", "everyday"],
    colors: ["washed black"],
    priceCents: 5995,
    stretchPct: 8,
    imageUrl: imagePath("agolde-straight.jpg"),
    galleryImageUrls: [
      imagePath("agolde-straight.jpg"),
      imagePath("hollywood-light.jpg"),
      imagePath("basile-light.jpg"),
    ],
  },
  {
    id: "wrangler-cowboy-cut-straight",
    brandSlug: "wrangler",
    sourceId: "wrangler-men-jeans",
    gender: "men" as const,
    title: "Cowboy Cut Straight Jean",
    cut: "regular" as const,
    fitTags: ["straight", "rigid"],
    styleTags: ["denim", "western", "workwear"],
    colors: ["rigid indigo"],
    priceCents: 6900,
    stretchPct: 1,
    imageUrl: imagePath("dark-slide.webp"),
    galleryImageUrls: [
      imagePath("dark-slide.webp"),
      imagePath("apc-elisabeth.webp"),
      imagePath("straight-flat.jpeg"),
    ],
  },
  {
    id: "lee-daren-regular-straight",
    brandSlug: "lee",
    sourceId: "lee-men-jeans",
    gender: "men" as const,
    title: "Daren Regular Straight Jean",
    cut: "regular" as const,
    fitTags: ["regular", "straight"],
    styleTags: ["denim", "heritage", "straight"],
    colors: ["blue black"],
    priceCents: 9200,
    stretchPct: 2,
    imageUrl: imagePath("light-packshot.webp"),
    galleryImageUrls: [
      imagePath("light-packshot.webp"),
      imagePath("agolde-straight.jpg"),
      imagePath("hollywood-light.jpg"),
    ],
  },
  {
    id: "madewell-everywear-mens-straight",
    brandSlug: "madewell",
    sourceId: "madewell-men-bottoms",
    gender: "men" as const,
    title: "Everywear Straight Jean",
    cut: "regular" as const,
    fitTags: ["straight", "premium"],
    styleTags: ["denim", "straight", "premium"],
    colors: ["vintage wash"],
    priceCents: 12800,
    stretchPct: 3,
    imageUrl: imagePath("vintage-hanger.jpg"),
    galleryImageUrls: [
      imagePath("vintage-hanger.jpg"),
      imagePath("straight-crop.jpeg"),
      imagePath("basile-light.jpg"),
    ],
  },
];

export const defaultFavoriteJeansInput: FavoriteJeansInput = {
  brandSlug: "madewell",
  sizeLabel: "29",
  inseamIn: 32,
};

export function resolveFavoriteJeans(
  input: FavoriteJeansInput = defaultFavoriteJeansInput,
): FavoriteJeansProfile {
  const parsedSize = parseJeansSizeInput(input.sizeLabel);
  const normalizedInseam = input.inseamIn ?? parsedSize.inseamIn;
  const normalizedInput: FavoriteJeansInput = {
    ...input,
    sizeLabel: parsedSize.sizeLabel,
    ...(normalizedInseam !== undefined ? { inseamIn: normalizedInseam } : {}),
  };
  const entry = findEntry(normalizedInput) ?? findEntry(defaultFavoriteJeansInput);
  if (!entry) {
    throw new Error("No favorite jeans entry available");
  }
  const brand = brandFor(entry.brandSlug);
  const source = sourceFor(entry.sourceId);
  const requestedInseam = normalizedInput.inseamIn
    ? round(normalizedInput.inseamIn * inch)
    : undefined;
  const inseamCm = requestedInseam ?? nearest(entry.inseamOptionsCm, 32 * inch);
  return {
    brandName: brand.name,
    brandSlug: entry.brandSlug,
    sizeLabel: entry.sizeLabel,
    waistCm: entry.waistCm,
    hipCm: entry.hipCm,
    inseamCm,
    sourceUrl: source.sourceUrl,
  };
}

export function findJeansFitMatches(
  input: FavoriteJeansInput = defaultFavoriteJeansInput,
): JeansFitMatch[] {
  const favorite = resolveFavoriteJeans(input);
  const products = generateJeansCatalogProducts();

  return products
    .flatMap((product) =>
      product.variants.map((variant) => {
        const waistCenter = center(
          variant.spec.waistMinCm,
          variant.spec.waistMaxCm,
        );
        const hipCenter = center(variant.spec.hipMinCm, variant.spec.hipMaxCm);
        const inseam = variant.spec.inseamCm ?? favorite.inseamCm;
        const fitScore = Math.round(
          Math.min(
            100,
            Math.max(
              0,
              100 -
                Math.abs(waistCenter - favorite.waistCm) * 3.3 -
                Math.abs(hipCenter - favorite.hipCm) * 2.3 -
                Math.abs(inseam - favorite.inseamCm) * 1.4 +
                Math.min(6, variant.spec.stretchPct),
            ),
          ),
        );
        return {
          brandName: product.brand.name,
          brandSlug: product.brand.slug,
          sizeLabel: variant.sizeLabel,
          sizeToBuy: variant.sizeLabel,
          waistCm: round(waistCenter),
          hipCm: round(hipCenter),
          inseamCm: round(inseam),
          fitScore,
          priceCents: product.priceCents,
          productId: product.id,
          productTitle: product.title,
          sourceUrl: product.sizeChartSourceUrl ?? "",
          note: `${product.brand.name} ${variant.sizeLabel} is ${Math.abs(round(waistCenter - favorite.waistCm, 1))}cm from your favorite waist.`,
        };
      }),
    )
    .sort((a, b) => b.fitScore - a.fitScore || a.priceCents - b.priceCents);
}

export function generateJeansCatalogProducts(): ProductRecord[] {
  return jeansProductDefinitions.map((definition, index) => {
    const brand = brandFor(definition.brandSlug);
    const source = sourceFor(definition.sourceId);
    const entries = jeansSizeChartEntries.filter(
      (entry) => entry.sourceId === definition.sourceId,
    );
    const color = definition.colors[0] ?? "indigo";
    const product: ProductRecord = {
      id: definition.id,
      merchantName: `${brand.name} Direct`,
      brand,
      title: definition.title,
      description: `${source.sourceNote} Rober normalizes this jeans chart against your favorite pair and recommends the closest size across price points.`,
      category: "bottoms",
      subcategory: "jeans",
      material: definition.stretchPct >= 6 ? "stretch denim" : "cotton denim",
      colors: definition.colors,
      styleTags: definition.styleTags,
      fitTags: definition.fitTags,
      priceCents: definition.priceCents,
      ...(index % 3 === 0
        ? { compareAtPriceCents: definition.priceCents + 2400 }
        : {}),
      currency: "USD",
      heroImageUrl: definition.imageUrl,
      rating: 4.3 + (index % 5) / 10,
      reviewCount: 62 + index * 31,
      galleryImageUrls: definition.galleryImageUrls,
      variants: buildJeansVariants(
        definition.id,
        entries,
        definition.priceCents,
        color,
        definition.cut,
        definition.stretchPct,
      ),
      createdAt: `${scrapedAt}T00:00:00.000Z`,
      sizeChartSourceUrl: source.sourceUrl,
      sizeChartSourceName: source.id,
      sourceDataQuality:
        definition.brandSlug === "american-eagle"
          ? "fit_model_normalized"
          : "scraped_official",
    };
    return product;
  });
}

function womenEntries(
  sourceId: string,
  brandName: string,
  brandSlug: string,
  rows: Array<[string, number, number]>,
): JeansSizeChartEntry[] {
  return rows.map(([sizeLabel, waistCm, hipCm]) => ({
    sourceId,
    brandName,
    brandSlug,
    gender: "women",
    sizeLabel,
    waistCm,
    hipCm,
    waistIn: round(waistCm / inch, 1),
    hipIn: round(hipCm / inch, 1),
    inseamOptionsCm: [29, 30, 32, 34].map((value) => round(value * inch)),
  }));
}

function menEntries(
  sourceId: string,
  brandName: string,
  brandSlug: string,
  rows: Array<[string, number, number]>,
): JeansSizeChartEntry[] {
  return rows.map(([sizeLabel, waistCm, hipCm]) => ({
    sourceId,
    brandName,
    brandSlug,
    gender: "men",
    sizeLabel,
    waistCm,
    hipCm,
    waistIn: round(waistCm / inch, 1),
    hipIn: round(hipCm / inch, 1),
    inseamOptionsCm: [30, 32, 34, 36].map((value) => round(value * inch)),
  }));
}

function aeCurvyEntries(): JeansSizeChartEntry[] {
  return womenEntries(
    "american-eagle-curvy-fit",
    "American Eagle",
    "american-eagle",
    ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33"].map(
      (sizeLabel) => {
        const waistIn = Number(sizeLabel) + 1;
        const hipIn = waistIn + 13;
        return [sizeLabel, round(waistIn * inch), round(hipIn * inch)] as [
          string,
          number,
          number,
        ];
      },
    ),
  );
}

function buildJeansVariants(
  productId: string,
  entries: JeansSizeChartEntry[],
  priceCents: number,
  color: string,
  cut: "slim" | "regular" | "relaxed" | "oversized",
  stretchPct: number,
): ProductVariantRecord[] {
  return entries.flatMap((entry, entryIndex) =>
    entry.inseamOptionsCm.map((inseamCm, inseamIndex) => {
      const inseamIn = Math.round(inseamCm / inch);
      const sizeLabel = `${entry.sizeLabel}x${inseamIn}`;
      return {
        id: `${productId}-${entry.sizeLabel.replace(".", "-")}-${inseamIn}`,
        productId,
        sizeLabel,
        color,
        sku: `${productId}-${sizeLabel}`,
        stock:
          entryIndex === 0 && inseamIndex === 0
            ? 0
            : 18 + entryIndex * 3 + inseamIndex,
        priceCents,
        spec: {
          waistMinCm: round(entry.waistCm - 1.6),
          waistMaxCm: round(entry.waistCm + 2.2),
          hipMinCm: round(entry.hipCm - 2.2),
          hipMaxCm: round(entry.hipCm + 2.8),
          inseamCm,
          stretchPct,
          cut,
        },
      };
    }),
  );
}

function findEntry(input: FavoriteJeansInput) {
  const normalizedSize = parseJeansSizeInput(input.sizeLabel).sizeLabel;
  return jeansSizeChartEntries.find(
    (entry) =>
      entry.brandSlug === input.brandSlug && entry.sizeLabel === normalizedSize,
  );
}

export function parseJeansSizeInput(sizeLabel: string) {
  const normalized = sizeLabel.trim().toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/^([a-z0-9.]+)(?:x(\d{2}))?$/);
  return {
    sizeLabel: match?.[1]?.toUpperCase() ?? sizeLabel.trim(),
    ...(match?.[2] ? { inseamIn: Number(match[2]) } : {}),
  };
}

function sourceFor(id: string) {
  const source = jeansSizeChartSources.find((item) => item.id === id);
  if (!source) {
    throw new Error(`Missing jeans size-chart source ${id}`);
  }
  return source;
}

function brandFor(slug: string) {
  const brand = jeansBrands.find((item) => item.slug === slug);
  if (!brand) {
    throw new Error(`Missing jeans brand ${slug}`);
  }
  return brand;
}

function nearest(values: number[], target: number) {
  return (
    values
      .slice()
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? target
  );
}

function center(min?: number, max?: number) {
  if (min === undefined || max === undefined) {
    return 0;
  }
  return (min + max) / 2;
}

function round(value: number, places = 0) {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
}
