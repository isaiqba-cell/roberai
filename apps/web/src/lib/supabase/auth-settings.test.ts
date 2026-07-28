import { parseAuthProviderSettings } from "./auth-settings";

describe("Supabase auth provider settings", () => {
  it("enables only providers explicitly reported as active", () => {
    expect(
      parseAuthProviderSettings({
        external: { email: true, google: true, github: false },
      }),
    ).toEqual({ email: true, google: true });

    expect(
      parseAuthProviderSettings({
        external: { email: true, google: false },
      }),
    ).toEqual({ email: true, google: false });
  });

  it("fails closed for malformed settings", () => {
    expect(parseAuthProviderSettings(null)).toEqual({
      email: false,
      google: false,
    });
    expect(parseAuthProviderSettings({ external: "invalid" })).toEqual({
      email: false,
      google: false,
    });
  });
});
