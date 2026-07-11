import {
  GarmentMatchResult,
  GarmentSpec,
  matchGarments,
  SilhouetteCut,
} from "@rober/fit-engine";
import { ProductRecord } from "@rober/api-client";
import { ProductCardModel } from "../components/product";

export type GarmentMatchSummary = {
  product: ProductRecord;
  card: ProductCardModel;
  sizeLabel: string;
  variantId: string;
  spec: GarmentSpec;
  result: GarmentMatchResult;
};

const silhouetteCutRank: Record<SilhouetteCut, number> = {
  skinny: 0,
  slim: 1,
  straight: 2,
  relaxed: 3,
  baggy: 4,
};

export function silhouetteCutFromSlider(value: number): SilhouetteCut {
  if (value <= 20) {
    return "skinny";
  }
  if (value <= 40) {
    return "slim";
  }
  if (value <= 60) {
    return "straight";
  }
  if (value <= 80) {
    return "relaxed";
  }
  return "baggy";
}

// Compares a resolved reference garment directly against every seeded
// catalog product's own construction spec (garment-to-garment), instead of
// scoring the catalog against a body profile.
export function computeGarmentMatches(
  anchorSpec: GarmentSpec,
  products: ProductRecord[],
): GarmentMatchSummary[] {
  return products
    .map((product): GarmentMatchSummary | undefined => {
      const category = product.subcategory === "chino" ? "chinos" : "jeans";
      const scored = product.variants
        .filter((variant) => variant.garmentSpec)
        .map((variant) => ({
          variant,
          result: matchGarments(anchorSpec, variant.garmentSpec as GarmentSpec, { category }),
        }))
        .sort((a, b) => b.result.confidence - a.result.confidence);
      const best = scored[0];
      if (!best) {
        return undefined;
      }
      const card: ProductCardModel = {
        id: product.id,
        brand: product.brand.name,
        title: product.title,
        priceCents: product.priceCents,
        ...(product.compareAtPriceCents
          ? { compareAtCents: product.compareAtPriceCents }
          : {}),
        imageUrl: product.heroImageUrl,
        fitConfidence: best.result.confidence,
        recommendedSize: best.variant.sizeLabel,
        explanation: matchReason(
          anchorSpec,
          best.variant.garmentSpec as GarmentSpec,
          best.result,
        ),
      };
      return {
        product,
        sizeLabel: best.variant.sizeLabel,
        variantId: best.variant.id,
        spec: best.variant.garmentSpec as GarmentSpec,
        result: best.result,
        card,
      };
    })
    .filter((entry): entry is GarmentMatchSummary => Boolean(entry))
    .sort((a, b) => b.result.confidence - a.result.confidence);
}

// One-line, human "why" for every card. Silhouette direction leads (it's
// the axis the user controls), backed by the biggest concrete dimension
// delta so the score never stands alone.
export function matchReason(
  anchor: GarmentSpec,
  candidate: GarmentSpec,
  result: GarmentMatchResult,
): string {
  const thighDelta =
    candidate.thighCm !== undefined && anchor.thighCm !== undefined
      ? candidate.thighCm - anchor.thighCm
      : undefined;
  const inseamDelta =
    candidate.inseamCm !== undefined && anchor.inseamCm !== undefined
      ? candidate.inseamCm - anchor.inseamCm
      : undefined;
  const inseamNote =
    inseamDelta !== undefined && Math.abs(inseamDelta) < 1.5
      ? "same length"
      : inseamDelta !== undefined
        ? `${inseamDelta > 0 ? "+" : ""}${Math.round(inseamDelta)} cm length`
        : undefined;

  if (result.silhouetteDelta === "same") {
    const thighNote =
      thighDelta !== undefined && Math.abs(thighDelta) <= 1.5
        ? "thigh within 1 cm"
        : "same silhouette";
    return `Cut like your pair · ${inseamNote ?? thighNote}`;
  }
  const direction = result.silhouetteDelta === "baggier" ? "Roomier" : "Slimmer";
  const thighNote =
    thighDelta !== undefined && Math.abs(thighDelta) >= 1
      ? `${thighDelta > 0 ? "+" : ""}${Math.round(thighDelta)} cm thigh`
      : undefined;
  return [`${direction} than your pair`, thighNote ?? inseamNote]
    .filter(Boolean)
    .join(" · ");
}

// Silhouette re-ranking with direction respected: candidates more than one
// cut-step away from the target are dropped entirely (a "baggier" request
// must never answer with a slim taper), then closest-cut wins, then
// confidence. Falls back to the loose ordering if strict filtering leaves
// too few options to compare.
export function rerankBySilhouette(
  summaries: GarmentMatchSummary[],
  targetCut: SilhouetteCut,
  confidenceFloor = 40,
): GarmentMatchSummary[] {
  const eligible = summaries.filter(
    (entry) => entry.result.confidence >= confidenceFloor,
  );
  const byDistance = (entries: GarmentMatchSummary[]) =>
    entries.slice().sort((a, b) => {
      const distanceA = Math.abs(silhouetteCutRank[a.spec.cut] - silhouetteCutRank[targetCut]);
      const distanceB = Math.abs(silhouetteCutRank[b.spec.cut] - silhouetteCutRank[targetCut]);
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }
      return b.result.confidence - a.result.confidence;
    });

  const strict = eligible.filter(
    (entry) =>
      Math.abs(silhouetteCutRank[entry.spec.cut] - silhouetteCutRank[targetCut]) <= 1,
  );
  return byDistance(strict.length >= 3 ? strict : eligible);
}

export function sortByPrice(summaries: GarmentMatchSummary[]) {
  return summaries.slice().sort((a, b) => a.product.priceCents - b.product.priceCents);
}

// The generated demo index intentionally has many cuts per benchmark brand.
// Surface the strongest option from each brand before returning to additional
// cuts, so the first comparison rail demonstrates actual cross-brand choice.
export function diversifyGarmentMatches(
  summaries: GarmentMatchSummary[],
): GarmentMatchSummary[] {
  const seenBrands = new Set<string>();
  const distinctBrands: GarmentMatchSummary[] = [];
  const remaining: GarmentMatchSummary[] = [];

  summaries.forEach((summary) => {
    if (seenBrands.has(summary.product.brand.slug)) {
      remaining.push(summary);
      return;
    }
    seenBrands.add(summary.product.brand.slug);
    distinctBrands.push(summary);
  });

  return [...distinctBrands, ...remaining];
}

export type GarmentCardCategory = {
  label: string;
  entry: GarmentMatchSummary;
};

// Generalizes the old jeans-only "Closest Match / Lower Price / More Stretch
// / Boot-Friendly" cards into reusable categories driven entirely by
// matchGarments output, so they apply to chinos and pants too.
export function pickGarmentCardCategories(
  anchorSpec: GarmentSpec,
  summaries: GarmentMatchSummary[],
): GarmentCardCategory[] {
  const usedIds = new Set<string>();
  const pick = (predicate: (entry: GarmentMatchSummary) => boolean) => {
    const entry =
      summaries.find((candidate) => !usedIds.has(candidate.product.id) && predicate(candidate)) ??
      summaries.find((candidate) => !usedIds.has(candidate.product.id));
    if (entry) {
      usedIds.add(entry.product.id);
    }
    return entry;
  };

  const bestMatch = pick(() => true);

  const byPrice = summaries
    .filter((entry) => entry.result.confidence >= 60 && !usedIds.has(entry.product.id))
    .slice()
    .sort((a, b) => a.product.priceCents - b.product.priceCents);
  const bestValue = byPrice[0];
  if (bestValue) {
    usedIds.add(bestValue.product.id);
  }

  const mostSimilarStretch = pick(
    (entry) => Math.abs(entry.spec.stretchPct - anchorSpec.stretchPct) <= 1,
  );
  const silhouetteVariant = pick((entry) => entry.spec.cut !== anchorSpec.cut);

  return [
    { label: "Best overall match", entry: bestMatch },
    { label: "Best value", entry: bestValue },
    { label: "Most similar stretch", entry: mostSimilarStretch },
    { label: "Silhouette variant", entry: silhouetteVariant },
  ].filter((row): row is GarmentCardCategory => Boolean(row.entry));
}
