import { NextRequest, NextResponse } from "next/server";

import {
  analyticsDistinctId,
  recordAnalyticsEvent,
} from "@/lib/analytics/server";
import { apiError } from "@/lib/http/api-error";
import { outboundClickSchema } from "@/lib/matches/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = outboundClickSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError("bad_request", "Invalid click event.", 400);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    await recordAnalyticsEvent(
      {
        event: "outbound_click",
        properties: {
          productId: parsed.data.productId,
          variantId: parsed.data.variantId,
          retailerDomain: parsed.data.retailerDomain,
          source: "style_detail",
        },
      },
      {
        userId: user?.id ?? null,
        distinctId: analyticsDistinctId(request, user?.id ?? null),
      },
    );
    return new NextResponse(null, { status: 202 });
  } catch {
    return apiError(
      "dependency_unavailable",
      "Event logging is temporarily unavailable.",
      503,
    );
  }
}
