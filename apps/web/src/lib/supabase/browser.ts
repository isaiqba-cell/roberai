"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseConfig } from "./config";
import type { Database } from "./database.types";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserClient | null | undefined;

export function getBrowserSupabaseClient(): BrowserClient | null {
  if (browserClient !== undefined) {
    return browserClient;
  }

  browserClient = publicSupabaseConfig
    ? createBrowserClient<Database>(
        publicSupabaseConfig.url,
        publicSupabaseConfig.anonKey,
      )
    : null;

  return browserClient;
}
