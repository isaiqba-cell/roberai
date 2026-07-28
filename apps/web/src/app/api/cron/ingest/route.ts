import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/ingestion/cron-auth";
import { drainIngestionJobs } from "@/lib/ingestion/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(request: Request) {
  if (
    !isCronAuthorized(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainIngestionJobs();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Ingestion cron failed", error);
    return NextResponse.json(
      { error: "The ingestion worker could not complete this run." },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
