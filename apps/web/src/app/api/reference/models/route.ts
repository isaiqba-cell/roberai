import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getReferenceModels } from "@/lib/reference/server";

const querySchema = z.object({
  brand: z.string().trim().min(1).max(80),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    brand: request.nextUrl.searchParams.get("brand"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a brand before loading models." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    models: await getReferenceModels(parsed.data.brand),
  });
}
