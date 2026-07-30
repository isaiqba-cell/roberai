import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/http/api-error";
import { isCronAuthorized } from "@/lib/ingestion/cron-auth";
import { drainIngestionJobs } from "@/lib/ingestion/worker";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const authorizationSchema = z.string().trim().min(1).max(512).nullable();

async function handle(request: Request) {
  const authorization = authorizationSchema.safeParse(
    request.headers.get("authorization"),
  );
  if (
    !authorization.success ||
    !isCronAuthorized(authorization.data, process.env.CRON_SECRET)
  ) {
    return apiError("unauthorized", "Unauthorized.", 401);
  }

  try {
    const result = await drainIngestionJobs();
    const admin = createSupabaseAdminClient();
    const { data: expiredRateLimitsPruned, error: pruneError } =
      await admin.rpc("prune_expired_api_rate_limits");
    if (pruneError) {
      console.error("Rate-limit maintenance failed", pruneError.message);
    }

    return NextResponse.json(
      {
        ...result,
        maintenance: {
          expiredRateLimitsPruned: expiredRateLimitsPruned ?? 0,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Ingestion cron failed", error);
    return apiError(
      "internal_error",
      "The ingestion worker could not complete this run.",
      500,
    );
  }
}

export const GET = handle;
export const POST = handle;
