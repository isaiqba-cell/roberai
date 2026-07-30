import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAccess } from "@/lib/admin/access";
import { apiError } from "@/lib/http/api-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const sourceIdSchema = z.uuid();

function readableSnapshot(raw: string) {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18_000);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccess();
  if (!access) {
    return apiError("not_found", "Not found.", 404);
  }

  const { id } = await context.params;
  const parsedId = sourceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError("not_found", "Not found.", 404);
  }

  const { data: source, error } = await access.supabase
    .from("size_chart_sources")
    .select("raw_snapshot_path")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error || !source) {
    return apiError("not_found", "Not found.", 404);
  }
  if (!source.raw_snapshot_path) {
    return NextResponse.json({ excerpt: null, available: false });
  }

  const admin = createSupabaseAdminClient();
  const snapshot = await admin.storage
    .from("size-chart-snapshots")
    .download(source.raw_snapshot_path);
  if (snapshot.error || !snapshot.data) {
    return apiError(
      "dependency_unavailable",
      "The archived snapshot is temporarily unavailable.",
      503,
    );
  }

  const excerpt = readableSnapshot(await snapshot.data.text());
  return NextResponse.json(
    { excerpt, available: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
