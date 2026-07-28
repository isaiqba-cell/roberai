import { mkdir, writeFile } from "node:fs/promises";

import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const url = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000/playground";
const chrome = await launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    onlyCategories: ["accessibility"],
    logLevel: "error",
  });
  if (!result) {
    throw new Error("Lighthouse did not return a report.");
  }

  const score = Math.round(
    (result.lhr.categories.accessibility?.score ?? 0) * 100,
  );
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/lighthouse-accessibility.json", result.report);
  console.log(`Lighthouse accessibility: ${score}`);

  if (score < 95) {
    process.exitCode = 1;
  }
} finally {
  await chrome.kill();
}
