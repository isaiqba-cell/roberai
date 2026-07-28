import { NextResponse } from "next/server";

import { outboundClickSchema } from "@/lib/matches/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = outboundClickSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid click event." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_name: "outbound_click",
      properties: {
        product_id: parsed.data.productId,
        variant_id: parsed.data.variantId,
        retailer_domain: parsed.data.retailerDomain,
        source: "style_detail",
      },
    });
    if (error) throw error;
    return new NextResponse(null, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "Event logging is temporarily unavailable." },
      { status: 503 },
    );
  }
}
