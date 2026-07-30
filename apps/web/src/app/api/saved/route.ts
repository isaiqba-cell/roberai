import { matchGarments } from "@rober/fit-engine";
import { matchReason } from "@rober/matching";
import { NextResponse } from "next/server";

import { getMatchingCatalog } from "@/lib/catalog/matching-catalog";
import { apiError } from "@/lib/http/api-error";
import { normalizeGarmentSpec, garmentSpecSchema } from "@/lib/reference/types";
import { savedMutationSchema, type SavedMatch } from "@/lib/saved-items";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function authenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await authenticatedContext();
  if (!supabase || !user) {
    return apiError("unauthorized", "Sign in required.", 401);
  }

  const [savedResult, anchorResult, catalog] = await Promise.all([
    supabase
      .from("saved_items")
      .select("product_id,variant_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_anchor_items")
      .select("resolved_spec")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle(),
    getMatchingCatalog(),
  ]);

  if (savedResult.error) {
    return apiError(
      "dependency_unavailable",
      "Saved styles could not be loaded.",
      503,
    );
  }

  const parsedAnchor = garmentSpecSchema.safeParse(
    anchorResult.data?.resolved_spec,
  );
  const anchor = parsedAnchor.success
    ? normalizeGarmentSpec(parsedAnchor.data)
    : null;
  const productMap = new Map(
    catalog.products.map((product) => [product.id, product]),
  );
  const items: SavedMatch[] = (savedResult.data ?? []).flatMap((row) => {
    const product = productMap.get(row.product_id);
    const variant = product?.variants.find(
      (candidate) => candidate.id === row.variant_id,
    );
    if (!product || !variant?.garmentSpec) return [];
    const result = anchor
      ? matchGarments(anchor, variant.garmentSpec, {
          category: product.subcategory === "chino" ? "chinos" : "jeans",
        })
      : null;
    return [
      {
        productId: product.id,
        variantId: variant.id,
        brandName: product.brand.name,
        title: product.title,
        imageUrl: product.heroImageUrl,
        priceCents: variant.priceCents,
        recommendedSize: variant.sizeLabel,
        confidence: result?.confidence ?? 0,
        reason:
          anchor && result
            ? matchReason(anchor, variant.garmentSpec, result)
            : "Saved size and construction",
        savedAt: row.created_at,
      },
    ];
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const parsed = savedMutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError("bad_request", "Invalid saved style.", 400);
  }

  const { supabase, user } = await authenticatedContext();
  if (!supabase || !user) {
    return apiError("unauthorized", "Sign in required.", 401);
  }

  const { error } = parsed.data.saved
    ? await supabase.from("saved_items").upsert(
        {
          user_id: user.id,
          product_id: parsed.data.productId,
          variant_id: parsed.data.variantId,
        },
        { onConflict: "user_id,product_id" },
      )
    : await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", parsed.data.productId);

  if (error) {
    return apiError(
      "dependency_unavailable",
      "Saved style could not be updated.",
      503,
    );
  }

  return NextResponse.json({ saved: parsed.data.saved });
}
