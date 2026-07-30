import {
  computeGarmentMatches,
  diversifyGarmentMatches,
  rerankBySilhouette,
  silhouetteCutFromSlider,
  sortByPrice,
} from "@rober/matching";
import { NextResponse } from "next/server";

import { getMatchingCatalog } from "@/lib/catalog/matching-catalog";
import { apiError } from "@/lib/http/api-error";
import {
  matchesRequestSchema,
  type MatchCardData,
  type MatchesResponse,
} from "@/lib/matches/types";
import { normalizeGarmentSpec } from "@/lib/reference/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = matchesRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError("bad_request", "The fit request was incomplete.", 400);
  }

  try {
    const catalog = await getMatchingCatalog();
    const targetCut = silhouetteCutFromSlider(parsed.data.silhouette);
    const anchor = normalizeGarmentSpec(parsed.data.anchor);
    const baseMatches = computeGarmentMatches(anchor, catalog.products);
    const catalogProducts = new Map(
      catalog.products.map((product) => [product.id, product]),
    );
    const silhouetteMatches = rerankBySilhouette(baseMatches, targetCut, 40);
    const nearestPriceCapCents =
      parsed.data.priceCapCents === null
        ? null
        : silhouetteMatches
            .filter(
              (entry) => entry.product.priceCents > parsed.data.priceCapCents!,
            )
            .reduce<number | null>(
              (nearest, entry) =>
                nearest === null
                  ? entry.product.priceCents
                  : Math.min(nearest, entry.product.priceCents),
              null,
            );
    const capped =
      parsed.data.priceCapCents === null
        ? silhouetteMatches
        : silhouetteMatches.filter(
            (entry) => entry.product.priceCents <= parsed.data.priceCapCents!,
          );
    const ordered = diversifyGarmentMatches(
      parsed.data.sort === "price" ? sortByPrice(capped) : capped,
    );

    const matches: MatchCardData[] = ordered
      .slice(0, parsed.data.limit)
      .map((entry) => ({
        id: entry.product.id,
        variantId: entry.variantId,
        brandName: entry.product.brand.name,
        brandSlug: entry.product.brand.slug,
        title: entry.product.title,
        description: entry.product.description,
        priceCents: entry.product.priceCents,
        compareAtPriceCents: entry.product.compareAtPriceCents ?? null,
        currency: entry.product.currency,
        imageUrl: entry.product.heroImageUrl,
        recommendedSize: entry.sizeLabel,
        confidence: entry.result.confidence,
        descriptor: entry.result.descriptor,
        reason:
          entry.card.explanation ??
          entry.result.explanation[0] ??
          "Close to your reference pair",
        silhouetteDelta: entry.result.silhouetteDelta,
        availableSizeCount: entry.product.variants.length,
        spec: entry.spec,
        dimensionScores: entry.result.dimensionScores,
        provenance: catalogProducts.get(entry.product.id)!.provenance,
      }));

    const response: MatchesResponse = {
      mode: catalog.mode,
      catalog: catalog.counts,
      targetCut,
      totalEligible: capped.length,
      nearestPriceCapCents,
      matches,
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return apiError(
      "dependency_unavailable",
      "The live jeans index is temporarily unavailable.",
      503,
    );
  }
}
