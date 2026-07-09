import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateDemoCatalog, getDemoBrands } from "@rober/api-client";

const root = resolve(process.cwd());
const seedDir = resolve(root, "supabase/seed");
mkdirSync(seedDir, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  disclosure:
    "Demo fit inventory uses public size-chart benchmark inputs with illustrative normalized listings. It is not live retailer inventory and does not imply retailer partnerships.",
  brands: getDemoBrands(),
  products: generateDemoCatalog()
};

const output = resolve(seedDir, "demo-catalog.json");
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${payload.products.length} products across ${payload.brands.length} benchmark brands to ${output}`);
