import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "../supabase/environment";

const targets = [
  {
    brandName: "Levi's",
    modelName: "Men's jeans body size chart",
    sourceUrl: "https://www.levi.com/US/en_US/info/sizeguide",
  },
  {
    brandName: "Madewell",
    modelName: "Women's denim body size chart",
    sourceUrl: "https://www.madewell.com/Denim-SizeChart.html",
  },
  {
    brandName: "Dickies",
    modelName: "874 workwear body size chart",
    sourceUrl: "https://www.dickies.com/en-us/pages/874-size-chart",
  },
  {
    brandName: "Dockers",
    modelName: "Men's bottoms body size chart",
    sourceUrl: "https://eu.dockers.com/pages/size-guide-waist",
  },
  {
    brandName: "American Eagle",
    modelName: "Men's jeans body size chart",
    sourceUrl: "https://www.ae.com/us/en/content/help/men-size-chart",
  },
] as const;

async function main() {
  const discoverSources = process.argv.includes("--discover");
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const jobs: Array<{ id: string; type: string; brandName: string }> = [];

  for (const target of targets) {
    const { data, error } = await admin.rpc("admin_enqueue_ingestion", {
      p_brand_name: target.brandName,
      p_model_name: target.modelName,
      p_source_url: discoverSources ? null : target.sourceUrl,
    });
    if (error) {
      throw new Error(
        `${target.brandName} could not be queued: ${error.message}`,
      );
    }
    const job = data as { id?: unknown; type?: unknown } | null;
    if (typeof job?.id !== "string" || typeof job.type !== "string") {
      throw new Error(`${target.brandName} returned an invalid job record.`);
    }
    jobs.push({ id: job.id, type: job.type, brandName: target.brandName });
  }

  console.log(
    JSON.stringify(
      {
        queued: jobs.length,
        discoveryMode: discoverSources ? "serper" : "fixed-source",
        jobs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
