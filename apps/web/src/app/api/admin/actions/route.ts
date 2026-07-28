import { NextRequest, NextResponse } from "next/server";

import { getAdminAccess } from "@/lib/admin/access";
import { adminActionSchema } from "@/lib/admin/actions";
import { clearMatchingCatalogCache } from "@/lib/catalog/matching-catalog";
import type { Json } from "@/lib/supabase/database.types";

function hiddenResponse() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return hiddenResponse();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "This operation could not be read." },
      { status: 400 },
    );
  }

  const parsed = adminActionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted operation details." },
      { status: 400 },
    );
  }

  const action = parsed.data;
  let result:
    | Awaited<ReturnType<typeof access.supabase.rpc>>
    | { data: Json | null; error: { message: string } | null };

  if (action.action === "review_source") {
    result = await access.supabase.rpc("admin_review_size_chart_source", {
      p_source_id: action.sourceId,
      p_decision: action.decision,
      p_rows: action.rows as unknown as Json,
      p_reason: action.reason ?? null,
    });
  } else if (action.action === "retry_job") {
    result = await access.supabase.rpc("admin_retry_ingestion_job", {
      p_job_id: action.jobId,
    });
  } else if (action.action === "enqueue_ingestion") {
    result = await access.supabase.rpc("admin_enqueue_ingestion", {
      p_brand_name: action.brandName,
      p_model_name: action.modelName,
      p_source_url: action.sourceUrl || null,
    });
  } else {
    result = await access.supabase.rpc("admin_takedown_size_chart_source", {
      p_source_id: action.sourceId,
      p_reason: action.reason,
    });
  }

  if (result.error) {
    return NextResponse.json(
      { error: "The operation did not complete. It has not changed live data." },
      { status: 500 },
    );
  }

  if (
    action.action === "review_source" ||
    action.action === "takedown_source"
  ) {
    clearMatchingCatalogCache();
  }

  return NextResponse.json(
    { ok: true, data: result.data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
