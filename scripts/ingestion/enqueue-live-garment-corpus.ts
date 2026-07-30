import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "../supabase/environment";

const targets = [
  {
    modelName: "The Original Cheeky Jean",
    sourceUrl:
      "https://www.everlane.com/products/womens-original-cheeky-jean-regular-washed-charcoal",
  },
  {
    modelName: "The Way-High Jean",
    sourceUrl:
      "https://www.everlane.com/products/womens-way-high-jean-long-ind",
  },
  {
    modelName: "The Way-High Skinny Jean",
    sourceUrl:
      "https://www.everlane.com/products/womens-mcj-way-high-skinny-jean-authentic-blue",
  },
  {
    modelName: "The Way-High Hourglass Skinny Jean",
    sourceUrl:
      "https://www.everlane.com/products/womens-curvy-way-high-skinny-jean-authentic-blue",
  },
] as const;

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const jobs: Array<{ id: string; modelName: string }> = [];

  for (const target of targets) {
    const { data, error } = await admin.rpc("admin_enqueue_ingestion", {
      p_brand_name: "Everlane",
      p_model_name: target.modelName,
      p_source_url: target.sourceUrl,
    });
    if (error) {
      throw new Error(
        `${target.modelName} could not be queued: ${error.message}`,
      );
    }
    const job = data as { id?: unknown } | null;
    if (typeof job?.id !== "string") {
      throw new Error(`${target.modelName} returned an invalid job record.`);
    }
    jobs.push({ id: job.id, modelName: target.modelName });
  }

  console.log(JSON.stringify({ queued: jobs.length, jobs }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
