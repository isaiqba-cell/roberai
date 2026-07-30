import { readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;
const configured =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT &&
  release;

if (!configured) {
  console.log(
    "Sentry source-map upload skipped: deployment credentials absent.",
  );
  process.exit(0);
}

function run(args) {
  const result = spawnSync("sentry-cli", args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`sentry-cli ${args[0]} failed.`);
  }
}

async function removeMaps(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return removeMaps(target);
      if (entry.name.endsWith(".map")) await rm(target);
    }),
  );
}

run(["sourcemaps", "inject", ".next"]);
run([
  "sourcemaps",
  "upload",
  "--org",
  process.env.SENTRY_ORG,
  "--project",
  process.env.SENTRY_PROJECT,
  "--release",
  release,
  ".next",
]);

await removeMaps(path.join(process.cwd(), ".next", "static"));
console.log(`Sentry source maps uploaded for release ${release}.`);
