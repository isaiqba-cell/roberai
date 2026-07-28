import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const payloadSchema = z.object({ anchorId: z.uuid() });

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sign in is unavailable." },
      { status: 401 },
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid reference pair." },
      { status: 400 },
    );
  }
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reference pair." },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("set_active_anchor", {
    p_anchor_id: parsed.data.anchorId,
  });
  if (error) {
    return NextResponse.json(
      { error: "The active pair could not be changed." },
      { status: 500 },
    );
  }
  return NextResponse.json({ active: parsed.data.anchorId });
}
