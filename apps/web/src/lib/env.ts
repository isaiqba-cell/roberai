import { z } from "zod";

const webEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SERPER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  SENTRY_DSN: z.url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  ADMIN_EMAILS: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((email) => email.trim()))
    .pipe(z.array(z.email()).min(1)),
});

export type WebEnvironment = z.output<typeof webEnvSchema>;

export type WebRuntimeEnvironment =
  | { mode: "live"; values: WebEnvironment; missing: [] }
  | { mode: "seed"; values: null; missing: string[] };

function issueFields(error: z.ZodError): string[] {
  return [
    ...new Set(
      error.issues.map((issue) => String(issue.path[0] ?? "environment")),
    ),
  ].sort();
}

export function resolveWebEnvironment(
  source: Record<string, string | undefined>,
  nodeEnv = source.NODE_ENV,
): WebRuntimeEnvironment {
  const parsed = webEnvSchema.safeParse(source);
  if (parsed.success) {
    return { mode: "live", values: parsed.data, missing: [] };
  }

  const missing = issueFields(parsed.error);
  if (nodeEnv === "production") {
    throw new Error(
      `Invalid production environment. Check: ${missing.join(", ")}`,
    );
  }

  return { mode: "seed", values: null, missing };
}

export const webEnvironment = resolveWebEnvironment(process.env);
