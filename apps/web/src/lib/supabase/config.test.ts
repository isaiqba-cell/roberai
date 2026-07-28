import { resolvePublicSupabaseConfig } from "./config";

describe("public Supabase configuration", () => {
  it("returns null when either public value is absent", () => {
    expect(resolvePublicSupabaseConfig({})).toBeNull();
    expect(
      resolvePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toBeNull();
  });

  it("accepts a complete public configuration", () => {
    expect(
      resolvePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });
});
