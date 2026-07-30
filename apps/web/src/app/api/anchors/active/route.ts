import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/http/api-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const payloadSchema = z.object({ anchorId: z.uuid() }).strict();

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError("unauthorized", "Sign in is unavailable.", 401);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("unauthorized", "Sign in required.", 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("bad_request", "Invalid reference pair.", 400);
  }
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("bad_request", "Invalid reference pair.", 400);
  }

  const { error } = await supabase.rpc("set_active_anchor", {
    p_anchor_id: parsed.data.anchorId,
  });
  if (error) {
    return apiError(
      "internal_error",
      "The active pair could not be changed.",
      500,
    );
  }
  return NextResponse.json({ active: parsed.data.anchorId });
}
