import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "apps/web/src");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const secretNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERPER_API_KEY",
  "OPENAI_API_KEY",
  "CRON_SECRET",
  "SENTRY_AUTH_TOKEN",
];
const errors = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const path of walk(sourceRoot)) {
  if (!sourceExtensions.has(extname(path)) || path.endsWith(".test.ts"))
    continue;
  const content = readFileSync(path, "utf8");
  const referenced = secretNames.filter((name) => content.includes(name));
  if (referenced.length === 0) continue;

  const displayPath = relative(root, path);
  const isClient = /^\s*["']use client["'];/m.test(content);
  const isCentralEnv = displayPath === "apps/web/src/lib/env.ts";
  const isRouteHandler =
    displayPath.startsWith("apps/web/src/app/api/") &&
    displayPath.endsWith("/route.ts");
  const markedServerOnly = /^\s*import ["']server-only["'];/m.test(content);
  if (isClient) {
    errors.push(
      `${displayPath} references server secrets from a client module.`,
    );
  }
  if (!isCentralEnv && !isRouteHandler && !markedServerOnly) {
    errors.push(
      `${displayPath} references ${referenced.join(", ")} without a server-only boundary.`,
    );
  }
}

const staticRoot = join(root, "apps/web/.next/static");
if (existsSync(staticRoot)) {
  for (const path of walk(staticRoot)) {
    const content = readFileSync(path, "utf8");
    const leaked = secretNames.filter((name) => content.includes(name));
    if (leaked.length > 0) {
      errors.push(
        `${relative(root, path)} contains server secret names: ${leaked.join(", ")}.`,
      );
    }
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}

console.log("Web server-secret boundaries passed.");
