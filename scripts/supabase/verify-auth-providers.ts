import { loadSupabaseCredentials } from "./environment";

type AuthSettings = {
  external?: {
    email?: boolean;
    google?: boolean;
  };
};

async function main() {
  const credentials = loadSupabaseCredentials();
  const response = await fetch(`${credentials.url}/auth/v1/settings`, {
    headers: { apikey: credentials.anonKey },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Auth settings returned HTTP ${response.status}.`);
  }

  const settings = (await response.json()) as AuthSettings;
  const missing = (["email", "google"] as const).filter(
    (provider) => settings.external?.[provider] !== true,
  );
  if (missing.length > 0) {
    throw new Error(
      `Stage 2 auth providers are not ready: ${missing.join(", ")}.`,
    );
  }

  console.log("Stage 2 auth providers verified: email, google.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
