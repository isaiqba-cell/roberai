import { NextRequest, NextResponse } from "next/server";

import { resolveReference } from "@/lib/reference/server";
import { referenceResolveInputSchema } from "@/lib/reference/types";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The reference pair could not be read." },
      { status: 400 },
    );
  }

  const parsed = referenceResolveInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the brand, model, and size, then try again." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      resolution: await resolveReference(parsed.data),
    });
  } catch {
    return NextResponse.json(
      { error: "We could not resolve that pair yet. Please retry." },
      { status: 500 },
    );
  }
}
