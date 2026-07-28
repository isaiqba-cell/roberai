import { resolveWebEnvironment } from "./env";

const validEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SERPER_API_KEY: "serper-key",
  OPENAI_API_KEY: "openai-key",
  SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
  NEXT_PUBLIC_POSTHOG_KEY: "posthog-key",
  CRON_SECRET: "cron-secret",
  ADMIN_EMAILS: "founder@example.com,operator@example.com",
};

describe("web environment validation", () => {
  it("falls back to deterministic seed mode during local development", () => {
    const result = resolveWebEnvironment({}, "development");

    expect(result.mode).toBe("seed");
    expect(result.missing).toContain("OPENAI_API_KEY");
  });

  it("fails fast when production configuration is incomplete", () => {
    expect(() => resolveWebEnvironment({}, "production")).toThrow(
      /Invalid production environment.*OPENAI_API_KEY/,
    );
  });

  it("returns parsed live configuration when every field is valid", () => {
    const result = resolveWebEnvironment(validEnvironment, "production");

    expect(result.mode).toBe("live");
    if (result.mode === "live") {
      expect(result.values.ADMIN_EMAILS).toEqual([
        "founder@example.com",
        "operator@example.com",
      ]);
    }
  });
});
