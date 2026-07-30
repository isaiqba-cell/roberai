import { NextRequest, NextResponse } from "next/server";

import { guestAnchorSchema } from "@/lib/guest-anchors";
import { apiError } from "@/lib/http/api-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ anchors: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ anchors: [] });
  }

  const { data, error } = await supabase
    .from("user_anchor_items")
    .select(
      "id,client_anchor_id,brand_name,style_name,tagged_size,category,active,resolved_spec,resolution_source,anchor_notes,tight_or_loose_notes,created_at",
    )
    .eq("user_id", user.id)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    return apiError(
      "internal_error",
      "Your reference pairs could not be loaded.",
      500,
    );
  }

  return NextResponse.json({ anchors: data ?? [] });
}

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
  const parsed = guestAnchorSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("bad_request", "Invalid reference pair.", 400);
  }

  const { data, error } = await supabase.rpc("merge_guest_anchors", {
    p_anchors: [parsed.data] as unknown as Json,
  });
  if (error) {
    return apiError(
      "internal_error",
      "Your reference pair could not be saved.",
      500,
    );
  }

  return NextResponse.json({ ids: data });
}
