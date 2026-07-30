import type { ErrorEvent } from "@sentry/node";

function configuredDsn() {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? undefined;
  return dsn && !dsn.includes("example.ingest.sentry.io") ? dsn : undefined;
}

const scrubEvent = (event: ErrorEvent) => {
  if (event.request) {
    delete event.request.data;
    const headers = event.request.headers;
    if (headers && typeof headers === "object") {
      const safeHeaders = { ...headers };
      delete safeHeaders.authorization;
      delete safeHeaders.Authorization;
      delete safeHeaders.cookie;
      delete safeHeaders.Cookie;
      event.request.headers = safeHeaders;
    }
  }
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : {};
  }
  return event;
};

export function sentryOptions(runtime: "browser" | "server" | "edge") {
  const dsn = configuredDsn();
  return {
    dsn,
    enabled: Boolean(dsn),
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
      process.env.SENTRY_RELEASE ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.npm_package_version,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enableLogs: false,
    beforeSend: scrubEvent,
    initialScope: { tags: { app: "rober-web", runtime } },
  };
}
