export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export async function onRequestError(
  error: unknown,
  _request: unknown,
  context: { routePath?: string; routeType?: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const Sentry = await import("@sentry/node");
  Sentry.captureException(error, {
    tags: {
      route: context.routePath ?? "unknown",
      routeType: context.routeType ?? "unknown",
    },
  });
  await Sentry.flush(2_000);
}
