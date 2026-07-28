import { NextResponse } from "next/server";

import { getReferenceBrands } from "@/lib/reference/server";

export async function GET() {
  return NextResponse.json({ brands: await getReferenceBrands() });
}
