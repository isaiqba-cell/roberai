import { NextRequest, NextResponse } from "next/server";

import { analyticsEventSchema } from "@/lib/analytics/events";
import {
  analyticsDistinctId,
  recordAnalyticsEvent,
} from "@/lib/analytics/server";
import { apiError } from "@/lib/http/api-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = analyticsEventSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError("bad_request", "Invalid analytics event.", 400);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const result = await recordAnalyticsEvent(parsed.data, {
      userId: user?.id ?? null,
      distinctId: analyticsDistinctId(request, user?.id ?? null),
    });
    return NextResponse.json(result, { status: 202 });
  } catch {
    return apiError(
      "dependency_unavailable",
      "Event logging is temporarily unavailable.",
      503,
    );
  }
}
