import * as Sentry from "@sentry/node";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAccess } from "@/lib/admin/access";
import { apiError } from "@/lib/http/api-error";

const payloadSchema = z.object({ confirm: z.literal("sentry") }).strict();

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return apiError("not_found", "Not found.", 404);

  const payload = payloadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return apiError("bad_request", "Monitoring check was not confirmed.", 400);
  }

  const error = new Error("Rober monitoring verification event");
  Sentry.captureException(error, {
    tags: { verification: "admin_monitoring_test" },
  });
  await Sentry.flush(2_000);

  return NextResponse.json(
    { accepted: Boolean(Sentry.getClient()) },
    { status: 202, headers: { "Cache-Control": "private, no-store" } },
  );
}
