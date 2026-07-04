import * as Sentry from "@sentry/react-native";

let initialized = false;

export function initializeSentry() {
  if (initialized || !process.env.SENTRY_DSN) {
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      if (event.extra) {
        delete event.extra.bodyProfile;
        delete event.extra.measurements;
      }
      return event;
    }
  });
  initialized = true;
}
