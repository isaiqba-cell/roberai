import type { AnalyticsEvent } from "./events";

export function trackAnalyticsEvent(event: AnalyticsEvent) {
  void fetch("/api/events/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => undefined);
}
