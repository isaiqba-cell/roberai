import { sentryOptions } from "@/lib/monitoring/sentry-options";

void import("@sentry/react").then((Sentry) => {
  Sentry.init(sentryOptions("browser"));
});
