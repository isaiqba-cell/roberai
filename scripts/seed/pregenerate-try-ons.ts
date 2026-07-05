import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createTryOnProvider,
  generateDemoCatalog,
  TryOnProviderKind,
} from "@rober/api-client";

// Reliability safeguard for scripted live-demo paths — NOT a replacement for
// the real in-app pipeline, which stays live/on-demand for real users. Run
// this the day before a demo against the exact variant IDs you plan to click
// through, so every render is already `ready` and nothing depends on a
// free-tier queue being fast during the pitch itself.
//
// Usage:
//   tsx scripts/seed/pregenerate-try-ons.ts --photo <uri> --variants <id1,id2,id3> [--dry-run] [--retries 3]
//
// Exits 0 only if every requested variant is `ready`. Exits 1 on any
// failure (including in --dry-run mode, where a "failure" means the pair
// isn't cached yet, since dry-run never calls the provider).

type CliArgs = {
  photoUri?: string;
  variantIds: string[];
  dryRun: boolean;
  retries: number;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { variantIds: [], dryRun: false, retries: 3 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--photo") {
      args.photoUri = argv[++i];
    } else if (arg === "--variants") {
      args.variantIds = (argv[++i] ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--retries") {
      args.retries = Number(argv[++i] ?? "3");
    }
  }
  return args;
}

function resolveProviderKind(): TryOnProviderKind {
  const configured = process.env.TRYON_PROVIDER;
  if (configured === "huggingface" || configured === "replicate") {
    return configured;
  }
  return "mock";
}

async function generateWithRetries(
  provider: ReturnType<typeof createTryOnProvider>,
  input: { photoUri: string; garmentImageUrl: string; variantId: string },
  retries: number,
) {
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await provider.generate(input);
      if (result.status === "ready") {
        return result;
      }
      lastError = result.error ?? "provider returned failed status";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    if (attempt < retries) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500 * attempt));
    }
  }
  return { status: "failed" as const, error: lastError };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.variantIds.length) {
    console.error("Usage: tsx scripts/seed/pregenerate-try-ons.ts --photo <uri> --variants <id1,id2,...> [--dry-run] [--retries 3]");
    process.exit(1);
  }

  const catalog = generateDemoCatalog();
  const variantIndex = new Map<string, { garmentImageUrl: string; productTitle: string }>();
  catalog.forEach((product) => {
    product.variants.forEach((variant) => {
      variantIndex.set(variant.id, {
        garmentImageUrl: product.heroImageUrl,
        productTitle: `${product.brand.name} ${product.title} (${variant.sizeLabel})`,
      });
    });
  });

  const providerKind = resolveProviderKind();
  const provider = createTryOnProvider(providerKind, {
    huggingface: { apiToken: process.env.HF_API_TOKEN, spaceId: process.env.HF_TRYON_SPACE_ID },
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN,
      modelVersion: process.env.REPLICATE_TRYON_MODEL_VERSION,
    },
  });

  console.log(`Provider: ${providerKind}${args.dryRun ? " (dry-run — no generation calls will be made)" : ""}`);
  console.log(`Variants requested: ${args.variantIds.length}`);

  const results: Array<{ variantId: string; title: string; status: "ready" | "failed"; error?: string }> = [];

  for (const variantId of args.variantIds) {
    const meta = variantIndex.get(variantId);
    if (!meta) {
      results.push({ variantId, title: "(unknown variant)", status: "failed", error: "Variant not found in seeded catalog" });
      continue;
    }
    if (args.dryRun) {
      results.push({ variantId, title: meta.productTitle, status: "failed", error: "dry-run: not generated" });
      continue;
    }
    if (!args.photoUri) {
      results.push({ variantId, title: meta.productTitle, status: "failed", error: "--photo is required outside dry-run mode" });
      continue;
    }
    const outcome = await generateWithRetries(
      provider,
      { photoUri: args.photoUri, garmentImageUrl: meta.garmentImageUrl, variantId },
      args.retries,
    );
    results.push({
      variantId,
      title: meta.productTitle,
      status: outcome.status,
      ...(outcome.status === "failed" ? { error: outcome.error } : {}),
    });
  }

  results.forEach((result) => {
    const line = `${result.status === "ready" ? "[ready]  " : "[failed] "}${result.variantId} — ${result.title}${result.error ? ` (${result.error})` : ""}`;
    console.log(line);
  });

  const outDir = resolve(process.cwd(), "supabase/seed");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "try-on-pregeneration-report.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), provider: providerKind, dryRun: args.dryRun, results }, null, 2)}\n`,
  );

  const failures = results.filter((result) => result.status !== "ready");
  if (failures.length) {
    console.error(`\n${failures.length}/${results.length} variant(s) not ready. Fix before the live demo.`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} variant(s) ready.`);
  process.exit(0);
}

void main();
