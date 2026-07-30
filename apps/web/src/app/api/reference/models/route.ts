import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/http/api-error";
import { getReferenceModels } from "@/lib/reference/server";

const querySchema = z
  .object({
    brand: z.string().trim().min(1).max(80),
  })
  .strict();

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    brand: request.nextUrl.searchParams.get("brand"),
  });
  if (!parsed.success) {
    return apiError(
      "bad_request",
      "Choose a brand before loading models.",
      400,
    );
  }

  return NextResponse.json({
    models: await getReferenceModels(parsed.data.brand),
  });
}
