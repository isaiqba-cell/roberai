import { env } from "./env";

export type AnalyticsEventName =
  | "onboarding_started"
  | "onboarding_completed"
  | "body_profile_completed"
  | "fit_confidence_badge_shown"
  | "search_submitted"
  | "search_parsed"
  | "compare_opened"
  | "best_fit_card_tapped"
  | "product_viewed"
  | "recommendation_rendered"
  | "size_selected"
  | "save_tapped"
  | "add_to_cart"
  | "cart_viewed"
  | "checkout_started"
  | "checkout_success"
  | "checkout_failed"
  | "order_confirmed"
  | "fit_feedback_submitted"
  | "notification_opt_in"
  | "profile_export_requested"
  | "profile_delete_requested";

const blockedKeys = new Set(["heightCm", "weightKg", "chestCm", "waistCm", "hipCm", "inseamCm", "shoulderCm", "shoeSizeUs"]);

export function sanitizeAnalyticsProperties(properties: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !blockedKeys.has(key)));
}

export function trackEvent(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}) {
  const safeProperties = sanitizeAnalyticsProperties(properties);
  if (env.demoMode) {
    console.debug("[analytics:demo]", eventName, safeProperties);
    return;
  }
  console.debug("[analytics:posthog-ready]", eventName, safeProperties);
}
