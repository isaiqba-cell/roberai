export type ApiMode = "supabase" | "demo";

export interface ApiClientConfig {
  mode: ApiMode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export function getApiMode(config: ApiClientConfig): ApiMode {
  return config.supabaseUrl && config.supabaseAnonKey ? "supabase" : "demo";
}

export * from "./catalog";
export * from "./checkout";
export * from "./ingestion";
export * from "./jeans";
export * from "./tryOn";
