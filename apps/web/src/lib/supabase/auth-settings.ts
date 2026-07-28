import { publicSupabaseConfig } from "@/lib/supabase/config";

export type AuthProviderSettings = {
  email: boolean;
  google: boolean;
};

const unavailableProviders: AuthProviderSettings = {
  email: false,
  google: false,
};

export function parseAuthProviderSettings(
  payload: unknown,
): AuthProviderSettings {
  if (!payload || typeof payload !== "object" || !("external" in payload)) {
    return unavailableProviders;
  }

  const external = payload.external;
  if (!external || typeof external !== "object") {
    return unavailableProviders;
  }

  return {
    email: "email" in external && external.email === true,
    google: "google" in external && external.google === true,
  };
}

export async function getAuthProviderSettings(): Promise<AuthProviderSettings> {
  if (!publicSupabaseConfig) {
    return unavailableProviders;
  }

  try {
    const response = await fetch(
      `${publicSupabaseConfig.url}/auth/v1/settings`,
      {
        cache: "no-store",
        headers: { apikey: publicSupabaseConfig.anonKey },
      },
    );
    if (!response.ok) {
      return unavailableProviders;
    }

    return parseAuthProviderSettings(await response.json());
  } catch {
    return unavailableProviders;
  }
}
