import type { GarmentSpec, SilhouetteCut } from "@rober/fit-engine";
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
  gender: JeansGender;
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

export type JeansFitFamily =
  | "straight"
  | "regular-straight"
  | "relaxed-straight"
  | "slim-taper"
  | "athletic-taper"
  | "bootcut"
  | "loose-baggy"
  | "workwear-straight";

export type JeansRiseBucket =
  | "at-waist"
  | "mid-rise"
  | "slightly-below-waist"
  | "low-rise"
  | "unknown";

export type JeansRoomLevel =
  | "slim"
  | "regular"
  | "regular-plus"
  | "relaxed"
  | "loose";

export type JeansLegBehavior =
  | "straight"
  | "tapered"
  | "slim-straight"
  | "slim-tapered"
  | "boot-friendly-straight"
  | "bootcut";

export type JeansStretchProfile =
  | "rigid"
  | "low-stretch"
  | "medium-stretch"
  | "high-stretch"
  | "performance-stretch";

export type JeansConstructionProfile =
  | "heritage-denim"
  | "everyday-denim"
  | "performance-denim"
  | "workwear-denim"
  | "non-denim-5-pocket";

export type JeansFitTaxonomy = {
  genderTarget: "men" | "women" | "unisex";
  category: "jeans" | "pants";
  fitFamily: JeansFitFamily;
  riseBucket: JeansRiseBucket;
  seatRoom: JeansRoomLevel;
  thighRoom: JeansRoomLevel;
  legShape: "straight" | "tapered" | "slim" | "bootcut" | "loose";
  hemBehavior: JeansLegBehavior;
  stretchProfile: JeansStretchProfile;
  constructionProfile: JeansConstructionProfile;
  bootCompatibility: "yes" | "some" | "no" | "unknown";
  styleNotes: string;
};

export type JeansTranslationStyle = {
  id: string;
  brandName: string;
  brandSlug: string;
  styleName: string;
  officialSignal: string;
  priceBand: "$" | "$$" | "$$$";
  priceCents: number;
  bestLeviAnchor: "501" | "505" | "511" | "514" | "541" | "550";
  confidence: "high" | "medium";
  taxonomy: JeansFitTaxonomy;
  spec: GarmentSpec;
};

export type GarmentReferenceInput = {
  brandSlug: string;
  modelName?: string;
  sizeLabel: string;
  inseamIn?: number;
  category?: "jeans" | "chinos" | "pants";
};

export type GarmentReferenceResolution = {
  brandName: string;
  brandSlug: string;
  gender: JeansGender;
  modelName: string;
  sizeLabel: string;
  category: "jeans" | "chinos" | "pants";
  spec: GarmentSpec;
  resolvedFromCatalog: boolean;
};

export type JeansTranslationRecommendation = {
  style: JeansTranslationStyle;
  label:
    | "closest-match"
    | "safer-roomier-option"
    | "cleaner-slimmer-option"
    | "more-stretch"
    | "better-for-boots";
  overallScore: number;
  silhouetteScore: number;
  seatThighScore: number;
  riseScore: number;
  stretchScore: number;
  legOpeningScore: number;
  constructionScore: number;
  recommendedSize: string;
  explanation: string;
};

export type JeansTranslationInput = {
  anchorStyleId?: string;
  taggedSize?: string;
};

const scrapedAt = "2026-07-04";
const inch = 2.54;
const imagePath = (fileName: string) => `/images/jeans/${fileName}`;

export const jeansBrands: BrandRecord[] = [
  {
    id: "brand-levis",
    name: "Levi's",
    slug: "levis",
    positioning:
      "Anchor denim brand used for 501, 505, 511, 514, 541, and 550 fit translation.",
    sizeChartConfidence: "verified",
  },
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
    id: "brand-dickies",
    name: "Dickies",
    slug: "dickies",
    positioning:
      "Workwear denim and utility pants mapped by relaxed, regular, slim, and loose construction.",
    sizeChartConfidence: "verified",
  },
  {
    id: "brand-dockers",
    name: "Dockers",
    slug: "dockers",
    positioning:
      "Five-pocket and khaki analog fits mapped into denim-style fit translation.",
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
    id: "levis-men-jeans",
    brandName: "Levi's",
    brandSlug: "levis",
    gender: "men",
    sourceUrl:
      "https://www.levi.com/US/en_US/features/men-jeans-guide",
    scrapedAt,
    sourceNote:
      "Official Levi's men's jeans guide used as the anchor fit family map for 501, 505, 511, 514, 541, and 550.",
  },
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
    id: "dickies-men-jeans",
    brandName: "Dickies",
    brandSlug: "dickies",
    gender: "men",
    sourceUrl: "https://www.dickies.com/size-chart",
    scrapedAt,
    sourceNote:
      "Official Dickies size and fit guidance normalized for workwear straight, slim, relaxed, and loose jeans.",
  },
  {
    id: "dockers-men-bottoms",
    brandName: "Dockers",
    brandSlug: "dockers",
    gender: "men",
    sourceUrl: "https://us.dockers.com/pages/size-chart",
    scrapedAt,
    sourceNote:
      "Official Dockers bottoms guidance normalized as non-denim five-pocket and khaki analog fits.",
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
  ...menEntries("levis-men-jeans", "Levi's", "levis", [
    ["28", 71, 87],
    ["29", 73.5, 89.5],
    ["30", 76, 92],
    ["31", 78.5, 94.5],
    ["32", 81.5, 97],
    ["33", 84, 99.5],
    ["34", 86.5, 102],
    ["36", 91.5, 107],
    ["38", 96.5, 112],
    ["40", 101.5, 117],
  ]),
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
  ...menEntries("dickies-men-jeans", "Dickies", "dickies", [
    ["28", 72, 87],
    ["29", 74.5, 89.5],
    ["30", 77, 92],
    ["31", 79.5, 94.5],
    ["32", 82, 97.5],
    ["33", 84.5, 100],
    ["34", 87, 102.5],
    ["36", 92.5, 108],
    ["38", 98, 113],
    ["40", 103.5, 118],
  ]),
  ...menEntries("dockers-men-bottoms", "Dockers", "dockers", [
    ["28", 71.5, 86],
    ["29", 74, 88.5],
    ["30", 76.5, 91],
    ["31", 79, 93.5],
    ["32", 81.5, 96],
    ["33", 84, 98.5],
    ["34", 86.5, 101],
    ["36", 91.5, 106],
    ["38", 96.5, 111],
    ["40", 101.5, 116],
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

type JeansCatalogCut = "slim" | "regular" | "relaxed" | "oversized";

type JeansProductDefinition = {
  id: string;
  brandSlug: string;
  sourceId: string;
  gender: JeansGender;
  title: string;
  cut: JeansCatalogCut;
  subcategory?: "jeans" | "chino";
  fitTags: string[];
  styleTags: string[];
  colors: string[];
  priceCents: number;
  stretchPct: number;
  imageUrl: string;
  galleryImageUrls: string[];
  catalogOrigin?: "seeded" | "normalized_demo";
};

const seedJeansProductDefinitions: JeansProductDefinition[] = [
  {
    id: "levis-501-original",
    brandSlug: "levis",
    sourceId: "levis-men-jeans",
    gender: "men" as const,
    title: "501 Original Fit Jean",
    cut: "regular" as const,
    fitTags: ["straight", "heritage", "rigid"],
    styleTags: ["denim", "straight", "heritage", "anchor fit"],
    colors: ["medium indigo"],
    priceCents: 9800,
    stretchPct: 1,
    imageUrl: imagePath("dark-slide.webp"),
    galleryImageUrls: [
      imagePath("dark-slide.webp"),
      imagePath("apc-elisabeth.webp"),
      imagePath("vintage-hanger.jpg"),
    ],
  },
  {
    id: "levis-511-slim",
    brandSlug: "levis",
    sourceId: "levis-men-jeans",
    gender: "men" as const,
    title: "511 Slim Jean",
    cut: "slim" as const,
    fitTags: ["slim", "tapered"],
    styleTags: ["denim", "slim", "modern", "taper"],
    colors: ["dark indigo"],
    priceCents: 9800,
    stretchPct: 3,
    imageUrl: imagePath("straight-crop.jpeg"),
    galleryImageUrls: [
      imagePath("straight-crop.jpeg"),
      imagePath("light-packshot.webp"),
      imagePath("agolde-straight.jpg"),
    ],
  },
  {
    id: "dickies-relaxed-carpenter",
    brandSlug: "dickies",
    sourceId: "dickies-men-jeans",
    gender: "men" as const,
    title: "Relaxed Fit Carpenter Jean",
    cut: "relaxed" as const,
    fitTags: ["relaxed", "workwear", "straight"],
    styleTags: ["denim", "workwear", "utility", "relaxed"],
    colors: ["washed indigo"],
    priceCents: 5999,
    stretchPct: 1,
    imageUrl: imagePath("hollywood-light.jpg"),
    galleryImageUrls: [
      imagePath("hollywood-light.jpg"),
      imagePath("basile-light.jpg"),
      imagePath("vintage-hanger.jpg"),
    ],
  },
  {
    id: "dockers-airweave-slim-taper",
    brandSlug: "dockers",
    sourceId: "dockers-men-bottoms",
    gender: "men" as const,
    title: "Go Airweave 5-Pocket Slim Tapered",
    cut: "slim" as const,
    subcategory: "chino" as const,
    fitTags: ["slim", "tapered", "stretch"],
    styleTags: ["office casual", "five pocket", "stretch", "slim", "chino"],
    colors: ["rinse blue"],
    priceCents: 8900,
    stretchPct: 7,
    imageUrl: imagePath("basile-light.jpg"),
    galleryImageUrls: [
      imagePath("basile-light.jpg"),
      imagePath("light-packshot.webp"),
      imagePath("straight-flat.jpeg"),
    ],
  },
  {
    id: "dockers-workday-classic-chino",
    brandSlug: "dockers",
    sourceId: "dockers-men-bottoms",
    gender: "men" as const,
    title: "Workday Classic Fit Chino",
    cut: "regular" as const,
    subcategory: "chino" as const,
    fitTags: ["regular", "straight", "office casual"],
    styleTags: ["office casual", "five pocket", "chino", "everyday"],
    colors: ["khaki"],
    priceCents: 7900,
    stretchPct: 5,
    imageUrl: imagePath("hollywood-light.jpg"),
    galleryImageUrls: [
      imagePath("hollywood-light.jpg"),
      imagePath("light-packshot.webp"),
      imagePath("basile-light.jpg"),
    ],
  },
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
    id: "range-trail-straight",
    brandSlug: "wrangler",
    sourceId: "wrangler-men-jeans",
    gender: "men" as const,
    title: "Range Trail Straight Jean",
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

// The original source-backed product records above make the reference
// journey credible. This expanded index gives the investor demo enough real
// choice to demonstrate search, fit ranking, price ranges, and size-level
// availability without presenting synthetic items as live retailer stock.
const indexedJeansArchetypes: Array<{
  slug: string;
  title: string;
  cut: JeansCatalogCut;
  fitTags: string[];
  styleTags: string[];
  stretchPct: number;
  priceOffsetCents: number;
}> = [
  {
    slug: "classic-straight",
    title: "Classic Straight Jean",
    cut: "regular",
    fitTags: ["straight", "heritage", "rigid"],
    styleTags: ["denim", "straight", "heritage", "everyday"],
    stretchPct: 1,
    priceOffsetCents: 0,
  },
  {
    slug: "everyday-straight",
    title: "Everyday Straight Jean",
    cut: "regular",
    fitTags: ["straight", "regular"],
    styleTags: ["denim", "straight", "everyday", "classic"],
    stretchPct: 2,
    priceOffsetCents: 900,
  },
  {
    slug: "slim-taper",
    title: "Slim Taper Jean",
    cut: "slim",
    fitTags: ["slim", "tapered"],
    styleTags: ["denim", "slim", "taper", "modern"],
    stretchPct: 3,
    priceOffsetCents: 1600,
  },
  {
    slug: "athletic-taper",
    title: "Athletic Taper Jean",
    cut: "slim",
    fitTags: ["athletic", "tapered", "stretch"],
    styleTags: ["denim", "athletic", "taper", "stretch"],
    stretchPct: 6,
    priceOffsetCents: 2500,
  },
  {
    slug: "relaxed-90s",
    title: "Relaxed '90s Jean",
    cut: "relaxed",
    fitTags: ["relaxed", "straight"],
    styleTags: ["denim", "relaxed", "heritage", "90s"],
    stretchPct: 1,
    priceOffsetCents: 1300,
  },
  {
    slug: "easy-straight",
    title: "Easy Straight Jean",
    cut: "relaxed",
    fitTags: ["relaxed", "stretch"],
    styleTags: ["denim", "relaxed", "stretch", "everyday"],
    stretchPct: 7,
    priceOffsetCents: 1800,
  },
  {
    slug: "wide-leg",
    title: "Wide Leg Jean",
    cut: "oversized",
    fitTags: ["wide", "loose"],
    styleTags: ["denim", "wide leg", "loose", "fashion"],
    stretchPct: 1,
    priceOffsetCents: 2200,
  },
  {
    slug: "workwear-relaxed",
    title: "Workwear Relaxed Jean",
    cut: "relaxed",
    fitTags: ["relaxed", "workwear", "straight"],
    styleTags: ["denim", "workwear", "utility", "relaxed"],
    stretchPct: 2,
    priceOffsetCents: 700,
  },
  {
    slug: "boot-ready",
    title: "Boot Ready Straight Jean",
    cut: "regular",
    fitTags: ["straight", "bootcut"],
    styleTags: ["denim", "bootcut", "western", "straight"],
    stretchPct: 2,
    priceOffsetCents: 1500,
  },
  {
    slug: "curve-straight",
    title: "Curve Straight Jean",
    cut: "relaxed",
    fitTags: ["curvy", "straight", "stretch"],
    styleTags: ["denim", "curvy", "straight", "stretch"],
    stretchPct: 8,
    priceOffsetCents: 2100,
  },
  {
    slug: "high-rise-straight",
    title: "High Rise Straight Jean",
    cut: "regular",
    fitTags: ["high rise", "straight"],
    styleTags: ["denim", "high rise", "straight", "classic"],
    stretchPct: 3,
    priceOffsetCents: 2400,
  },
  {
    slug: "flex-five-pocket",
    title: "Flex Five-Pocket Jean",
    cut: "regular",
    fitTags: ["regular", "stretch"],
    styleTags: ["denim", "five pocket", "stretch", "everyday"],
    stretchPct: 9,
    priceOffsetCents: 2900,
  },
];

const indexedImagePaths = [
  imagePath("dark-slide.webp"),
  imagePath("light-packshot.webp"),
  imagePath("straight-flat.jpeg"),
  imagePath("basile-light.jpg"),
  imagePath("straight-crop.jpeg"),
  imagePath("hollywood-light.jpg"),
  imagePath("agolde-straight.jpg"),
  imagePath("apc-elisabeth.webp"),
  imagePath("vintage-hanger.jpg"),
];

const basePriceByBrandSlug: Record<string, number> = {
  levis: 9800,
  madewell: 13200,
  lee: 7900,
  wrangler: 6900,
  dickies: 5900,
  dockers: 8400,
  "old-navy": 4999,
  "american-eagle": 5995,
};

function buildExpandedJeansProductDefinitions(): JeansProductDefinition[] {
  return jeansSizeChartSources.flatMap((source, sourceIndex) =>
    indexedJeansArchetypes.map((archetype, archetypeIndex) => {
      const imageIndex = (sourceIndex * 3 + archetypeIndex) % indexedImagePaths.length;
      const imageUrl = indexedImagePaths[imageIndex] ?? indexedImagePaths[0]!;
      const galleryImageUrls = [
        imageUrl,
        indexedImagePaths[(imageIndex + 3) % indexedImagePaths.length]!,
        indexedImagePaths[(imageIndex + 6) % indexedImagePaths.length]!,
      ];
      const basePrice = basePriceByBrandSlug[source.brandSlug] ?? 7900;
      const priceCents = Math.max(
        3999,
        basePrice + archetype.priceOffsetCents + (sourceIndex % 3) * 250,
      );
      const sizeSpecificTags =
        source.gender === "women" && archetype.slug === "curve-straight"
          ? ["curvy", "waist-to-hip"]
          : source.gender === "men" && archetype.slug === "athletic-taper"
            ? ["athletic", "seat-thigh room"]
            : [];

      return {
        id: `index-${source.id}-${archetype.slug}`,
        brandSlug: source.brandSlug,
        sourceId: source.id,
        gender: source.gender,
        title: archetype.title,
        cut: archetype.cut,
        fitTags: [...archetype.fitTags, ...sizeSpecificTags],
        styleTags: [...archetype.styleTags, ...sizeSpecificTags, "indexed"],
        colors: [
          [
            "raw indigo",
            "dark rinse",
            "mid blue",
            "vintage light",
            "washed black",
            "ecru",
          ][(sourceIndex + archetypeIndex) % 6] ?? "indigo",
        ],
        priceCents,
        stretchPct: archetype.stretchPct,
        imageUrl,
        galleryImageUrls,
        catalogOrigin: "normalized_demo",
      };
    }),
  );
}

const jeansProductDefinitions: JeansProductDefinition[] = [
  ...seedJeansProductDefinitions,
  ...buildExpandedJeansProductDefinitions(),
];

const rawJeansTranslationStyles: Omit<JeansTranslationStyle, "spec">[] = [
  {
    id: "levis-501-original",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "501 Original",
    officialSignal: "Iconic straight fit, button fly, heritage benchmark.",
    priceBand: "$$",
    priceCents: 9800,
    bestLeviAnchor: "501",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "straight",
      riseBucket: "at-waist",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "rigid",
      constructionProfile: "heritage-denim",
      bootCompatibility: "some",
      styleNotes: "Classic straight anchor with structured denim feel.",
    },
  },
  {
    id: "levis-505-regular-straight",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "505 Regular Straight",
    officialSignal: "Zip-fly straight fit with a slightly roomy profile.",
    priceBand: "$$",
    priceCents: 8900,
    bestLeviAnchor: "505",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "regular-straight",
      riseBucket: "at-waist",
      seatRoom: "regular-plus",
      thighRoom: "regular-plus",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "low-stretch",
      constructionProfile: "everyday-denim",
      bootCompatibility: "some",
      styleNotes: "Roomier straight alternative for users who like 501 but want more ease.",
    },
  },
  {
    id: "levis-511-slim",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "511 Slim",
    officialSignal: "Slim fit with a tapered leg.",
    priceBand: "$$",
    priceCents: 9800,
    bestLeviAnchor: "511",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "slim-taper",
      riseBucket: "mid-rise",
      seatRoom: "slim",
      thighRoom: "slim",
      legShape: "tapered",
      hemBehavior: "slim-tapered",
      stretchProfile: "medium-stretch",
      constructionProfile: "everyday-denim",
      bootCompatibility: "no",
      styleNotes: "Cleaner slim progression when a straight fit feels too boxy.",
    },
  },
  {
    id: "levis-514-straight",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "514 Straight",
    officialSignal: "Modern straight family with a cleaner profile.",
    priceBand: "$$",
    priceCents: 8900,
    bestLeviAnchor: "514",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "regular-straight",
      riseBucket: "mid-rise",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "low-stretch",
      constructionProfile: "everyday-denim",
      bootCompatibility: "some",
      styleNotes: "Modern straight option close to a 501 silhouette.",
    },
  },
  {
    id: "levis-541-athletic-taper",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "541 Athletic Taper",
    officialSignal: "More room in seat and thigh with a tapered leg.",
    priceBand: "$$",
    priceCents: 8900,
    bestLeviAnchor: "541",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "athletic-taper",
      riseBucket: "mid-rise",
      seatRoom: "relaxed",
      thighRoom: "relaxed",
      legShape: "tapered",
      hemBehavior: "tapered",
      stretchProfile: "medium-stretch",
      constructionProfile: "performance-denim",
      bootCompatibility: "no",
      styleNotes: "Safer when straight jeans are tight through athletic thighs.",
    },
  },
  {
    id: "levis-550-relaxed",
    brandName: "Levi's",
    brandSlug: "levis",
    styleName: "550 Relaxed",
    officialSignal: "Relaxed family with extra room through the body.",
    priceBand: "$$",
    priceCents: 8900,
    bestLeviAnchor: "550",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "relaxed-straight",
      riseBucket: "at-waist",
      seatRoom: "relaxed",
      thighRoom: "relaxed",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "low-stretch",
      constructionProfile: "heritage-denim",
      bootCompatibility: "some",
      styleNotes: "Roomier straight alternative for comfort-first users.",
    },
  },
  {
    id: "range-trail-original",
    brandName: "Range Standard",
    brandSlug: "wrangler",
    styleName: "Range Trail Original Fit",
    officialSignal: "Sits at waist, easy through seat/thigh/knee, fits over boots.",
    priceBand: "$",
    priceCents: 6900,
    bestLeviAnchor: "501",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "straight",
      riseBucket: "at-waist",
      seatRoom: "regular-plus",
      thighRoom: "regular-plus",
      legShape: "straight",
      hemBehavior: "boot-friendly-straight",
      stretchProfile: "rigid",
      constructionProfile: "workwear-denim",
      bootCompatibility: "yes",
      styleNotes: "Closest heritage/workwear analog when a 501 user wears boots.",
    },
  },
  {
    id: "range-trail-regular",
    brandName: "Range Standard",
    brandSlug: "wrangler",
    styleName: "Range Trail Regular Fit",
    officialSignal: "Regular through seat and thigh, sits at waist, fits over boots.",
    priceBand: "$",
    priceCents: 6900,
    bestLeviAnchor: "505",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "regular-straight",
      riseBucket: "at-waist",
      seatRoom: "regular-plus",
      thighRoom: "regular-plus",
      legShape: "straight",
      hemBehavior: "boot-friendly-straight",
      stretchProfile: "low-stretch",
      constructionProfile: "workwear-denim",
      bootCompatibility: "yes",
      styleNotes: "Roomier straight option with western boot compatibility.",
    },
  },
  {
    id: "range-trail-relaxed",
    brandName: "Range Standard",
    brandSlug: "wrangler",
    styleName: "Range Trail Relaxed Fit",
    officialSignal: "Relaxed seat and thigh with a boot-friendly leg.",
    priceBand: "$",
    priceCents: 6900,
    bestLeviAnchor: "550",
    confidence: "medium",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "relaxed-straight",
      riseBucket: "at-waist",
      seatRoom: "relaxed",
      thighRoom: "relaxed",
      legShape: "straight",
      hemBehavior: "boot-friendly-straight",
      stretchProfile: "low-stretch",
      constructionProfile: "workwear-denim",
      bootCompatibility: "yes",
      styleNotes: "Safer if the favorite pair feels tight in seat or thigh.",
    },
  },
  {
    id: "lee-legendary-regular-straight",
    brandName: "Lee",
    brandSlug: "lee",
    styleName: "Legendary 100% Cotton Regular Straight",
    officialSignal: "Regular, mid rise, straight, 100% cotton.",
    priceBand: "$",
    priceCents: 8900,
    bestLeviAnchor: "501",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "straight",
      riseBucket: "mid-rise",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "rigid",
      constructionProfile: "heritage-denim",
      bootCompatibility: "some",
      styleNotes: "Strong 501 analog when the user wants 100% cotton structure.",
    },
  },
  {
    id: "lee-extreme-motion-regular-straight",
    brandName: "Lee",
    brandSlug: "lee",
    styleName: "Extreme Motion Regular Fit Straight Leg",
    officialSignal: "Regular, mid rise, straight with stretch comfort.",
    priceBand: "$",
    priceCents: 9200,
    bestLeviAnchor: "505",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "regular-straight",
      riseBucket: "mid-rise",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "performance-stretch",
      constructionProfile: "performance-denim",
      bootCompatibility: "some",
      styleNotes: "Best if the user likes the 501/505 shape but wants more stretch.",
    },
  },
  {
    id: "dickies-relaxed-fit-carpenter",
    brandName: "Dickies",
    brandSlug: "dickies",
    styleName: "Relaxed Fit Carpenter Jeans",
    officialSignal: "Relaxed through seat and thighs, straight leg, slightly below waist.",
    priceBand: "$",
    priceCents: 5999,
    bestLeviAnchor: "550",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "workwear-straight",
      riseBucket: "slightly-below-waist",
      seatRoom: "relaxed",
      thighRoom: "relaxed",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "rigid",
      constructionProfile: "workwear-denim",
      bootCompatibility: "some",
      styleNotes: "Workwear-safe option if thighs usually feel tight.",
    },
  },
  {
    id: "dickies-flex-regular-5-pocket",
    brandName: "Dickies",
    brandSlug: "dickies",
    styleName: "FLEX Regular Fit 5-Pocket Jeans",
    officialSignal: "Regular utility silhouette with stretch-friendly construction.",
    priceBand: "$",
    priceCents: 5499,
    bestLeviAnchor: "514",
    confidence: "medium",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "workwear-straight",
      riseBucket: "mid-rise",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "medium-stretch",
      constructionProfile: "workwear-denim",
      bootCompatibility: "some",
      styleNotes: "Budget workwear alternative to a clean modern straight.",
    },
  },
  {
    id: "dickies-flex-slim",
    brandName: "Dickies",
    brandSlug: "dickies",
    styleName: "FLEX Slim Fit Jeans",
    officialSignal: "More fitted workwear option.",
    priceBand: "$",
    priceCents: 5499,
    bestLeviAnchor: "511",
    confidence: "medium",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "slim-taper",
      riseBucket: "mid-rise",
      seatRoom: "slim",
      thighRoom: "regular",
      legShape: "slim",
      hemBehavior: "slim-straight",
      stretchProfile: "medium-stretch",
      constructionProfile: "workwear-denim",
      bootCompatibility: "no",
      styleNotes: "Workwear slim progression when 501 feels too wide below the knee.",
    },
  },
  {
    id: "dickies-loose-double-knee",
    brandName: "Dickies",
    brandSlug: "dickies",
    styleName: "Loose Fit Double Knee Jeans",
    officialSignal: "Loose workwear block with reinforced utility cues.",
    priceBand: "$",
    priceCents: 6499,
    bestLeviAnchor: "550",
    confidence: "medium",
    taxonomy: {
      genderTarget: "men",
      category: "jeans",
      fitFamily: "loose-baggy",
      riseBucket: "mid-rise",
      seatRoom: "loose",
      thighRoom: "loose",
      legShape: "loose",
      hemBehavior: "straight",
      stretchProfile: "rigid",
      constructionProfile: "workwear-denim",
      bootCompatibility: "some",
      styleNotes: "Intentional loose fit for users who want extra room.",
    },
  },
  {
    id: "dockers-workday-classic",
    brandName: "Dockers",
    brandSlug: "dockers",
    styleName: "Workday Classic Fit",
    officialSignal: "Straight opening with generous room through hip and thigh.",
    priceBand: "$$",
    priceCents: 7900,
    bestLeviAnchor: "505",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "pants",
      fitFamily: "regular-straight",
      riseBucket: "mid-rise",
      seatRoom: "regular-plus",
      thighRoom: "regular-plus",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "medium-stretch",
      constructionProfile: "non-denim-5-pocket",
      bootCompatibility: "some",
      styleNotes: "Office-casual analog for users who like 505/514 ease.",
    },
  },
  {
    id: "dockers-straight-signature",
    brandName: "Dockers",
    brandSlug: "dockers",
    styleName: "Straight Fit Signature",
    officialSignal: "Straight, clean everyday bottoms profile.",
    priceBand: "$$",
    priceCents: 7900,
    bestLeviAnchor: "514",
    confidence: "medium",
    taxonomy: {
      genderTarget: "men",
      category: "pants",
      fitFamily: "regular-straight",
      riseBucket: "mid-rise",
      seatRoom: "regular",
      thighRoom: "regular",
      legShape: "straight",
      hemBehavior: "straight",
      stretchProfile: "medium-stretch",
      constructionProfile: "non-denim-5-pocket",
      bootCompatibility: "some",
      styleNotes: "Cleaner 514-like option when denim is too casual.",
    },
  },
  {
    id: "dockers-airweave-slim-taper",
    brandName: "Dockers",
    brandSlug: "dockers",
    styleName: "Go Airweave 5-Pocket Slim Tapered",
    officialSignal: "Slim through hip/thigh with a slim leg opening.",
    priceBand: "$$",
    priceCents: 8900,
    bestLeviAnchor: "511",
    confidence: "high",
    taxonomy: {
      genderTarget: "men",
      category: "pants",
      fitFamily: "slim-taper",
      riseBucket: "mid-rise",
      seatRoom: "slim",
      thighRoom: "slim",
      legShape: "tapered",
      hemBehavior: "slim-tapered",
      stretchProfile: "performance-stretch",
      constructionProfile: "non-denim-5-pocket",
      bootCompatibility: "no",
      styleNotes: "Cleanest slimmer office-casual progression from a 501.",
    },
  },
];

// Numeric construction measurements (thigh/rise/leg opening/hem/knee/stretch)
// derived from each style's qualitative taxonomy, so garment-to-garment
// matching compares actual cm deltas rather than only taxonomy labels.
const baselineThighCm = 59;
const baselineKneeOffsetCm = 14;

const riseBucketCm: Record<JeansRiseBucket, number> = {
  "at-waist": 27,
  "mid-rise": 25,
  "slightly-below-waist": 23,
  "low-rise": 21,
  unknown: 25,
};

const hemBehaviorCm: Record<JeansLegBehavior, number> = {
  straight: 19,
  tapered: 16,
  "slim-straight": 17,
  "slim-tapered": 15.5,
  "boot-friendly-straight": 21.5,
  bootcut: 23,
};

const stretchProfileToPct: Record<JeansStretchProfile, number> = {
  rigid: 1,
  "low-stretch": 3,
  "medium-stretch": 6,
  "high-stretch": 10,
  "performance-stretch": 8,
};

const fitFamilyCut: Record<JeansFitFamily, SilhouetteCut> = {
  straight: "straight",
  "regular-straight": "straight",
  "relaxed-straight": "relaxed",
  "slim-taper": "slim",
  "athletic-taper": "straight",
  bootcut: "straight",
  "loose-baggy": "baggy",
  "workwear-straight": "straight",
};

const roomLevelRank: Record<JeansRoomLevel, number> = {
  slim: 1,
  regular: 2,
  "regular-plus": 3,
  relaxed: 4,
  loose: 5,
};

function deriveGarmentSpecFromTaxonomy(taxonomy: JeansFitTaxonomy): GarmentSpec {
  const thighDelta = (roomLevelRank[taxonomy.thighRoom] - 2) * 2.4;
  const thighCm = round(baselineThighCm + thighDelta, 1);
  const hemCm = hemBehaviorCm[taxonomy.hemBehavior];
  const legOpeningCm = round(
    hemCm + (taxonomy.hemBehavior.includes("taper") ? 2.5 : 0.8),
    1,
  );
  return {
    thighCm,
    riseCm: riseBucketCm[taxonomy.riseBucket],
    legOpeningCm,
    hemCm,
    kneeCm: round(thighCm - baselineKneeOffsetCm, 1),
    stretchPct: stretchProfileToPct[taxonomy.stretchProfile],
    cut: fitFamilyCut[taxonomy.fitFamily],
  };
}

export const jeansTranslationStyles: JeansTranslationStyle[] =
  rawJeansTranslationStyles.map((style) => ({
    ...style,
    spec: deriveGarmentSpecFromTaxonomy(style.taxonomy),
  }));

export const defaultFavoriteJeansInput: FavoriteJeansInput = {
  brandSlug: "levis",
  sizeLabel: "32",
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
    gender: entry.gender,
    sizeLabel: entry.sizeLabel,
    waistCm: entry.waistCm,
    hipCm: entry.hipCm,
    inseamCm,
    sourceUrl: source.sourceUrl,
  };
}

// Resolves "brand + model/style name + size" to a structured canonical
// GarmentSpec, combining the real waist/inseam chart entry with the
// matched style's derived construction measurements. Falls back to a
// self-reported spec (and logs the gap for the admin ingestion queue)
// when the specific brand/model/size isn't indexed yet.
export function resolveGarmentReference(
  input: GarmentReferenceInput,
): GarmentReferenceResolution {
  const parsedSize = parseJeansSizeInput(input.sizeLabel);
  const inseamIn = input.inseamIn ?? parsedSize.inseamIn;
  const entry = findEntry({
    brandSlug: input.brandSlug,
    sizeLabel: parsedSize.sizeLabel,
    ...(inseamIn !== undefined ? { inseamIn } : {}),
  });
  const brandStyles = jeansTranslationStyles.filter(
    (style) => style.brandSlug === input.brandSlug,
  );
  const style = input.modelName
    ? (brandStyles.find((candidate) =>
        normalizeModelName(candidate.styleName).includes(
          normalizeModelName(input.modelName as string),
        ),
      ) ?? brandStyles[0])
    : brandStyles[0];

  if (!entry || !style) {
    // eslint-disable-next-line no-console
    console.warn(
      `[garment-reference-gap] No indexed chart for ${input.brandSlug} ${input.modelName ?? ""} ${input.sizeLabel}. Self-reported spec used; flagged for admin ingestion.`,
    );
    return {
      brandName:
        jeansBrands.find((brand) => brand.slug === input.brandSlug)?.name ??
        input.brandSlug,
      brandSlug: input.brandSlug,
      gender: entry?.gender ?? "men",
      modelName: input.modelName ?? "Self-reported",
      sizeLabel: parsedSize.sizeLabel,
      category: input.category ?? "jeans",
      resolvedFromCatalog: false,
      spec: {
        ...(entry ? { waistCm: entry.waistCm } : {}),
        ...(inseamIn !== undefined ? { inseamCm: round(inseamIn * inch) } : {}),
        stretchPct: 2,
        cut: "straight",
      },
    };
  }

  const inseamCm = inseamIn
    ? round(inseamIn * inch)
    : nearest(entry.inseamOptionsCm, 32 * inch);

  return {
    brandName: brandFor(style.brandSlug).name,
    brandSlug: style.brandSlug,
    gender: entry.gender,
    modelName: style.styleName,
    sizeLabel: parsedSize.sizeLabel,
    category: style.taxonomy.category === "pants" ? "chinos" : "jeans",
    resolvedFromCatalog: true,
    spec: {
      ...style.spec,
      waistCm: entry.waistCm,
      inseamCm,
    },
  };
}

function normalizeModelName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function findJeansFitMatches(
  input: FavoriteJeansInput = defaultFavoriteJeansInput,
): JeansFitMatch[] {
  const favorite = resolveFavoriteJeans(input);
  const products = generateJeansCatalogProducts().filter(
    (product) => product.gender === favorite.gender,
  );

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

export function getJeansTranslationStyle(styleId: string) {
  return jeansTranslationStyles.find((style) => style.id === styleId);
}

export function translateFavoriteJeansFit(
  input: JeansTranslationInput = {},
): {
  anchor: JeansTranslationStyle;
  recommendedSize: string;
  recommendations: JeansTranslationRecommendation[];
} {
  const anchor =
    getJeansTranslationStyle(input.anchorStyleId ?? "levis-501-original") ??
    jeansTranslationStyles[0];
  if (!anchor) {
    throw new Error("No jeans translation anchor available");
  }
  const recommendedSize = input.taggedSize ?? "32x32";
  const recommendations = jeansTranslationStyles
    .filter((style) => style.id !== anchor.id)
    .map((style) =>
      buildTranslationRecommendation(anchor, style, recommendedSize),
    )
    .sort(
      (a, b) =>
        b.overallScore - a.overallScore ||
        a.style.priceCents - b.style.priceCents,
    );

  return { anchor, recommendedSize, recommendations };
}

let generatedJeansCatalog: ProductRecord[] | undefined;

export type JeansIndexStats = {
  chartSources: number;
  benchmarkBrands: number;
  productStyles: number;
  fitReadyVariants: number;
  priceFloorCents: number;
  priceCeilingCents: number;
};

export function generateJeansCatalogProducts(): ProductRecord[] {
  if (generatedJeansCatalog) {
    return generatedJeansCatalog;
  }

  generatedJeansCatalog = jeansProductDefinitions.map((definition, index) => {
    const brand = brandFor(definition.brandSlug);
    const source = sourceFor(definition.sourceId);
    const entries = jeansSizeChartEntries.filter(
      (entry) => entry.sourceId === definition.sourceId,
    );
    const color = definition.colors[0] ?? "indigo";
    const subcategory = "subcategory" in definition ? definition.subcategory : "jeans";
    const product: ProductRecord = {
      id: definition.id,
      merchantName: `${brand.name} Direct`,
      brand,
      title: definition.title,
      description:
        definition.catalogOrigin === "normalized_demo"
          ? `Fit-index demo inventory normalized from the ${source.brandName} size chart and Rober's construction model. This illustrative listing demonstrates cross-brand size translation and is not live retailer inventory.`
          : `${source.sourceNote} Rober normalizes this ${subcategory} chart against your favorite pair and recommends the closest size across price points.`,
      category: "bottoms",
      subcategory,
      material:
        subcategory === "chino"
          ? "cotton chino"
          : definition.stretchPct >= 6
            ? "stretch denim"
            : "cotton denim",
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
        definition.brandSlug,
        entries,
        definition.priceCents,
        color,
        definition.cut,
        definition.stretchPct,
      ),
      createdAt: `${scrapedAt}T00:00:00.000Z`,
      gender: definition.gender,
      sizeChartSourceUrl: source.sourceUrl,
      sizeChartSourceName: source.id,
      sourceDataQuality:
        definition.catalogOrigin === "normalized_demo" ||
        definition.brandSlug === "american-eagle"
          ? "fit_model_normalized"
          : "scraped_official",
    };
    return product;
  });

  return generatedJeansCatalog;
}

export function getJeansIndexStats(): JeansIndexStats {
  const products = generateJeansCatalogProducts();
  const prices = products.map((product) => product.priceCents);
  return {
    chartSources: jeansSizeChartSources.length,
    benchmarkBrands: new Set(products.map((product) => product.brand.slug)).size,
    productStyles: products.length,
    fitReadyVariants: products.reduce(
      (total, product) =>
        total + product.variants.filter((variant) => variant.stock > 0).length,
      0,
    ),
    priceFloorCents: Math.min(...prices),
    priceCeilingCents: Math.max(...prices),
  };
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

const brandConstructionProfile: Record<
  string,
  { thighDeltaCm: number; riseBucket: JeansRiseBucket; legOpeningDeltaCm: number }
> = {
  levis: { thighDeltaCm: 0, riseBucket: "at-waist", legOpeningDeltaCm: 0 },
  madewell: { thighDeltaCm: -1.2, riseBucket: "mid-rise", legOpeningDeltaCm: -0.8 },
  lee: { thighDeltaCm: 1, riseBucket: "mid-rise", legOpeningDeltaCm: 0.3 },
  wrangler: { thighDeltaCm: 2.6, riseBucket: "at-waist", legOpeningDeltaCm: 2.4 },
  dickies: { thighDeltaCm: 1.8, riseBucket: "slightly-below-waist", legOpeningDeltaCm: 1.2 },
  dockers: { thighDeltaCm: 0.4, riseBucket: "mid-rise", legOpeningDeltaCm: 0.6 },
  "old-navy": { thighDeltaCm: 0.6, riseBucket: "mid-rise", legOpeningDeltaCm: 0.4 },
  "american-eagle": { thighDeltaCm: 2.2, riseBucket: "low-rise", legOpeningDeltaCm: 1.6 },
};

const cutAdjustCm: Record<"slim" | "regular" | "relaxed" | "oversized", number> = {
  slim: -2.4,
  regular: 0,
  relaxed: 2.2,
  oversized: 4.2,
};

const cutToSilhouette: Record<"slim" | "regular" | "relaxed" | "oversized", SilhouetteCut> = {
  slim: "slim",
  regular: "straight",
  relaxed: "relaxed",
  oversized: "baggy",
};

function deriveCatalogGarmentSpec(
  brandSlug: string,
  cut: "slim" | "regular" | "relaxed" | "oversized",
  stretchPct: number,
): Omit<GarmentSpec, "waistCm" | "inseamCm"> {
  const profile = brandConstructionProfile[brandSlug] ?? brandConstructionProfile.levis!;
  const thighCm = round(baselineThighCm + profile.thighDeltaCm + cutAdjustCm[cut], 1);
  const hemCm = round(19 + profile.legOpeningDeltaCm + cutAdjustCm[cut] * 0.35, 1);
  return {
    thighCm,
    riseCm: riseBucketCm[profile.riseBucket],
    legOpeningCm: round(hemCm + 0.8, 1),
    hemCm,
    kneeCm: round(thighCm - baselineKneeOffsetCm, 1),
    stretchPct,
    cut: cutToSilhouette[cut],
  };
}

function buildJeansVariants(
  productId: string,
  brandSlug: string,
  entries: JeansSizeChartEntry[],
  priceCents: number,
  color: string,
  cut: "slim" | "regular" | "relaxed" | "oversized",
  stretchPct: number,
): ProductVariantRecord[] {
  const garmentBase = deriveCatalogGarmentSpec(brandSlug, cut, stretchPct);
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
        garmentSpec: {
          ...garmentBase,
          waistCm: entry.waistCm,
          inseamCm,
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

function buildTranslationRecommendation(
  anchor: JeansTranslationStyle,
  style: JeansTranslationStyle,
  recommendedSize: string,
): JeansTranslationRecommendation {
  const silhouetteScore = taxonomyScore(
    anchor.taxonomy.fitFamily,
    style.taxonomy.fitFamily,
    compatibleFitFamilies,
  );
  const seatScore = rankedScore(
    anchor.taxonomy.seatRoom,
    style.taxonomy.seatRoom,
    roomRank,
  );
  const thighScore = rankedScore(
    anchor.taxonomy.thighRoom,
    style.taxonomy.thighRoom,
    roomRank,
  );
  const seatThighScore = Math.round((seatScore + thighScore) / 2);
  const riseScore = taxonomyScore(
    anchor.taxonomy.riseBucket,
    style.taxonomy.riseBucket,
    compatibleRiseBuckets,
  );
  const stretchScore = rankedScore(
    anchor.taxonomy.stretchProfile,
    style.taxonomy.stretchProfile,
    stretchRank,
  );
  const legOpeningScore = taxonomyScore(
    anchor.taxonomy.hemBehavior,
    style.taxonomy.hemBehavior,
    compatibleHemBehaviors,
  );
  const constructionScore = taxonomyScore(
    anchor.taxonomy.constructionProfile,
    style.taxonomy.constructionProfile,
    compatibleConstructionProfiles,
  );
  const overallScore = Math.round(
    silhouetteScore * 0.35 +
      seatThighScore * 0.2 +
      riseScore * 0.15 +
      stretchScore * 0.15 +
      legOpeningScore * 0.1 +
      constructionScore * 0.05,
  );
  const label = translationLabel(anchor, style);

  return {
    style,
    label,
    overallScore,
    silhouetteScore,
    seatThighScore,
    riseScore,
    stretchScore,
    legOpeningScore,
    constructionScore,
    recommendedSize,
    explanation: explanationForTranslation(anchor, style, label),
  };
}

const compatibleFitFamilies: Record<string, string[]> = {
  straight: ["regular-straight", "workwear-straight"],
  "regular-straight": ["straight", "workwear-straight"],
  "relaxed-straight": ["workwear-straight", "loose-baggy"],
  "slim-taper": ["athletic-taper"],
  "athletic-taper": ["slim-taper", "relaxed-straight"],
  "workwear-straight": ["straight", "regular-straight", "relaxed-straight"],
};

const compatibleRiseBuckets: Record<string, string[]> = {
  "at-waist": ["mid-rise"],
  "mid-rise": ["at-waist", "slightly-below-waist"],
  "slightly-below-waist": ["mid-rise"],
};

const compatibleHemBehaviors: Record<string, string[]> = {
  straight: ["boot-friendly-straight", "slim-straight"],
  "boot-friendly-straight": ["straight", "bootcut"],
  tapered: ["slim-tapered"],
  "slim-tapered": ["tapered", "slim-straight"],
  bootcut: ["boot-friendly-straight"],
};

const compatibleConstructionProfiles: Record<string, string[]> = {
  "heritage-denim": ["everyday-denim", "workwear-denim"],
  "everyday-denim": ["heritage-denim", "performance-denim"],
  "performance-denim": ["everyday-denim", "non-denim-5-pocket"],
  "workwear-denim": ["heritage-denim", "everyday-denim"],
  "non-denim-5-pocket": ["performance-denim", "everyday-denim"],
};

const roomRank: Record<JeansRoomLevel, number> = {
  slim: 1,
  regular: 2,
  "regular-plus": 3,
  relaxed: 4,
  loose: 5,
};

const stretchRank: Record<JeansStretchProfile, number> = {
  rigid: 1,
  "low-stretch": 2,
  "medium-stretch": 3,
  "high-stretch": 4,
  "performance-stretch": 5,
};

function taxonomyScore(
  anchorValue: string,
  candidateValue: string,
  compatibility: Record<string, string[]>,
) {
  if (anchorValue === candidateValue) {
    return 100;
  }
  if (compatibility[anchorValue]?.includes(candidateValue)) {
    return 84;
  }
  if (compatibility[candidateValue]?.includes(anchorValue)) {
    return 78;
  }
  return 58;
}

function rankedScore<T extends string>(
  anchorValue: T,
  candidateValue: T,
  ranks: Record<T, number>,
) {
  const difference = Math.abs(ranks[anchorValue] - ranks[candidateValue]);
  return Math.max(48, 100 - difference * 16);
}

function translationLabel(
  anchor: JeansTranslationStyle,
  style: JeansTranslationStyle,
): JeansTranslationRecommendation["label"] {
  if (
    style.taxonomy.bootCompatibility === "yes" &&
    anchor.taxonomy.bootCompatibility !== "yes"
  ) {
    return "better-for-boots";
  }
  if (
    stretchRank[style.taxonomy.stretchProfile] >
    stretchRank[anchor.taxonomy.stretchProfile] + 1
  ) {
    return "more-stretch";
  }
  if (
    roomRank[style.taxonomy.seatRoom] > roomRank[anchor.taxonomy.seatRoom] ||
    roomRank[style.taxonomy.thighRoom] > roomRank[anchor.taxonomy.thighRoom]
  ) {
    return "safer-roomier-option";
  }
  if (
    roomRank[style.taxonomy.seatRoom] < roomRank[anchor.taxonomy.seatRoom] ||
    style.taxonomy.hemBehavior.includes("taper")
  ) {
    return "cleaner-slimmer-option";
  }
  return "closest-match";
}

function explanationForTranslation(
  anchor: JeansTranslationStyle,
  style: JeansTranslationStyle,
  label: JeansTranslationRecommendation["label"],
) {
  const intro = labelCopy[label];
  return `${intro}: ${style.styleName} maps from your ${anchor.styleName} through ${style.taxonomy.fitFamily}, ${style.taxonomy.seatRoom} seat, ${style.taxonomy.thighRoom} thigh, ${style.taxonomy.hemBehavior} hem, and ${style.taxonomy.stretchProfile} fabric.`;
}

const labelCopy: Record<JeansTranslationRecommendation["label"], string> = {
  "closest-match": "Closest to your anchor fit",
  "safer-roomier-option": "Safer if your thighs or seat feel tight",
  "cleaner-slimmer-option": "Cleaner and slimmer than your usual pair",
  "more-stretch": "Best if you want more stretch",
  "better-for-boots": "Better over boots",
};

export function parseJeansSizeInput(sizeLabel: string) {
  const normalized = sizeLabel.trim().toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/^([0-9.]+)(?:x(\d{2}))?$/);
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
