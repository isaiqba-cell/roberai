import { NextResponse } from "next/server";

import { getCatalogIndexStatus } from "@/lib/catalog/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getCatalogIndexStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
