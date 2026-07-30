import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/http/api-error";
import { resolveReference } from "@/lib/reference/server";
import { referenceResolveInputSchema } from "@/lib/reference/types";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError(
      "bad_request",
      "The reference pair could not be read.",
      400,
    );
  }

  const parsed = referenceResolveInputSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      "bad_request",
      "Check the brand, model, and size, then try again.",
      400,
    );
  }

  try {
    return NextResponse.json({
      resolution: await resolveReference(parsed.data),
    });
  } catch {
    return apiError(
      "dependency_unavailable",
      "We could not resolve that pair yet. Please retry.",
      503,
    );
  }
}
