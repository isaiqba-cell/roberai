import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

import { analyticsEventSchema, type AnalyticsEvent } from "./events";

function analyticsSecret() {
  return (
    process.env.CRON_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "rober-local-analytics"
  );
}

export function analyticsDistinctId(
  request: NextRequest,
  userId: string | null,
) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const identity = userId
    ? `user:${userId}`
    : `guest:${
        request.headers.get("cf-connecting-ip") ??
        forwarded?.trim() ??
        request.headers.get("x-real-ip") ??
        "unavailable"
      }`;
  return createHmac("sha256", analyticsSecret()).update(identity).digest("hex");
}

async function forwardToPostHog(event: AnalyticsEvent, distinctId: string) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey || apiKey.startsWith("ci-placeholder")) return false;

  const host = (
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
  ).replace(/\/$/, "");
  try {
    const response = await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: event.event,
        properties: {
          distinct_id: distinctId,
          ...event.properties,
          $lib: "rober-web",
          $process_person_profile: false,
        },
      }),
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function recordAnalyticsEvent(
  input: AnalyticsEvent,
  context: { userId: string | null; distinctId: string },
) {
  const event = analyticsEventSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("analytics_events").insert({
    user_id: context.userId,
    event_name: event.event,
    properties: event.properties as Json,
  });
  if (error) throw error;

  const posthogForwarded = await forwardToPostHog(event, context.distinctId);
  return { firstPartyRecorded: true, posthogForwarded };
}
