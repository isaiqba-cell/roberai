import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(1),
});

export type PublicSupabaseConfig = z.infer<typeof publicSupabaseSchema>;

export function resolvePublicSupabaseConfig(source: {
  NEXT_PUBLIC_SUPABASE_URL?: string | undefined;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string | undefined;
}): PublicSupabaseConfig | null {
  const parsed = publicSupabaseSchema.safeParse({
    url: source.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return parsed.success ? parsed.data : null;
}

export const publicSupabaseConfig = resolvePublicSupabaseConfig({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
