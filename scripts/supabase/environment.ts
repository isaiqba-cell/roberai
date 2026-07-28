import fs from "node:fs";
import path from "node:path";

type SupabaseCredentials = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

function readLocalEnvironment() {
  const filePath = path.resolve(process.cwd(), "apps/web/.env.local");
  if (!fs.existsSync(filePath)) {
    return new Map<string, string>();
  }

  const values = new Map<string, string>();
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    values.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }
  return values;
}

function readEnvironmentValue(name: string) {
  const local = readLocalEnvironment();
  return process.env[name] || local.get(name) || "";
}

export function loadSupabaseCredentials(): SupabaseCredentials {
  const credentials = {
    url: readEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: readEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
  };
  const missing = Object.entries(credentials)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase credentials: ${missing.join(", ")}`);
  }

  return credentials;
}
