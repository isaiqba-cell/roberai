import { matchGarments } from "@rober/fit-engine";
import { computeGarmentMatches } from "@rober/matching";
import { NextResponse } from "next/server";

import { getMatchingCatalogProduct } from "@/lib/catalog/matching-catalog";
import {
  styleDetailRequestSchema,
  type MatchCardData,
  type StyleDetailResponse,
  type StyleDimensionDelta,
} from "@/lib/matches/types";
import { normalizeGarmentSpec } from "@/lib/reference/types";

const dimensions = [
  { key: "waistCm", label: "Waist", scoreKey: "waist" },
  { key: "inseamCm", label: "Inseam", scoreKey: "inseam" },
  { key: "thighCm", label: "Thigh", scoreKey: "thigh" },
  { key: "riseCm", label: "Rise", scoreKey: "rise" },
  { key: "legOpeningCm", label: "Leg opening", scoreKey: "legOpening" },
] as const;

function buildOutboundUrl(
  baseUrl: string,
  productId: string,
  title: string,
  size: string,
) {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "rober");
  url.searchParams.set("utm_medium", "fit_referral");
  url.searchParams.set("utm_campaign", "translated_fit");
  url.searchParams.set("utm_content", productId);
  url.searchParams.set("rober_size", size);
  url.searchParams.set("rober_style", title);
  return url.toString();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const [{ id }, body] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const parsed = styleDetailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A reference pair is required for fit detail." },
      { status: 400 },
    );
  }

  const { product } = await getMatchingCatalogProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Style not found." }, { status: 404 });
  }

  const anchor = normalizeGarmentSpec(parsed.data.anchor);
  const summary = computeGarmentMatches(anchor, [product])[0];
  if (!summary) {
    return NextResponse.json(
      { error: "This style does not have fit-ready measurements." },
      { status: 422 },
    );
  }

  const sizes = product.variants
    .flatMap((variant) => {
      if (!variant.garmentSpec) return [];
      const result = matchGarments(anchor, variant.garmentSpec, {
        category: product.subcategory === "chino" ? "chinos" : "jeans",
      });
      return [
        {
          variantId: variant.id,
          sizeLabel: variant.sizeLabel,
          priceCents: variant.priceCents,
          confidence: result.confidence,
          descriptor: result.descriptor,
          spec: variant.garmentSpec,
          dimensionScores: result.dimensionScores,
        },
      ];
    })
    .sort((a, b) => b.confidence - a.confidence);

  const dimensionDeltas: StyleDimensionDelta[] = dimensions.flatMap(
    ({ key, label, scoreKey }) => {
      const anchorValue = anchor[key];
      const candidateValue = summary.spec[key];
      if (anchorValue === undefined || candidateValue === undefined) return [];
      return [
        {
          key,
          label,
          anchorValue,
          candidateValue,
          delta: Math.round((candidateValue - anchorValue) * 10) / 10,
          score: summary.result.dimensionScores[scoreKey] ?? null,
        },
      ];
    },
  );

  const recommended: MatchCardData = {
    id: product.id,
    variantId: summary.variantId,
    brandName: product.brand.name,
    brandSlug: product.brand.slug,
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents ?? null,
    currency: product.currency,
    imageUrl: product.heroImageUrl,
    recommendedSize: summary.sizeLabel,
    confidence: summary.result.confidence,
    descriptor: summary.result.descriptor,
    reason:
      summary.card.explanation ??
      summary.result.explanation[0] ??
      "Close to your reference pair",
    silhouetteDelta: summary.result.silhouetteDelta,
    availableSizeCount: product.variants.length,
    spec: summary.spec,
    dimensionScores: summary.result.dimensionScores,
    provenance: product.provenance,
  };

  const response: StyleDetailResponse = {
    product: {
      id: product.id,
      brandName: product.brand.name,
      brandSlug: product.brand.slug,
      title: product.title,
      description: product.description,
      material: product.material,
      imageUrl: product.heroImageUrl,
      priceCents: product.priceCents,
      currency: product.currency,
    },
    recommended,
    sizes,
    dimensions: dimensionDeltas,
    provenance: product.provenance,
    retailer: {
      merchantName: product.retailer.merchantName,
      domain: product.retailer.domain,
      outboundUrl: buildOutboundUrl(
        product.retailer.baseUrl,
        product.id,
        product.title,
        summary.sizeLabel,
      ),
    },
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
