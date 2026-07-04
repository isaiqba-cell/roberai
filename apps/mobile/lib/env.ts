import Constants from "expo-constants";

type ExpoExtra = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  EXPO_PUBLIC_POSTHOG_HOST?: string;
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_DEMO_MODE?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? extra.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? extra.EXPO_PUBLIC_POSTHOG_HOST,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? extra.EXPO_PUBLIC_APP_ENV ?? "development",
  demoMode: (process.env.EXPO_PUBLIC_DEMO_MODE ?? extra.EXPO_PUBLIC_DEMO_MODE ?? "true") !== "false"
};
