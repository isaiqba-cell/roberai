import { spawnSync } from "node:child_process";

const temporaryAllowlist = new Map([
  [
    "GHSA-6g55-p6wh-862q",
    {
      packageName: "postcss",
      expires: "2026-08-31",
      reason: "Next pins PostCSS; Rober does not process user-controlled CSS.",
    },
  ],
  [
    "GHSA-r28c-9q8g-f849",
    {
      packageName: "postcss",
      expires: "2026-08-31",
      reason: "Next pins PostCSS; Rober does not process user-controlled CSS.",
    },
  ],
]);

const audit = spawnSync(
  "npm",
  [
    "audit",
    "--workspace",
    "@rober/web",
    "--omit=dev",
    "--audit-level=high",
    "--json",
  ],
  { encoding: "utf8" },
);

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error(audit.stderr || "Unable to parse npm audit output.");
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const today = new Date().toISOString().slice(0, 10);
const blockedPackages = new Set();
const activeExceptions = [];

for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
  if (!["high", "critical"].includes(vulnerability.severity)) {
    continue;
  }

  const directAdvisories = vulnerability.via.filter(
    (entry) => typeof entry === "object",
  );
  const unapproved = directAdvisories.filter((advisory) => {
    const advisoryId = advisory.url?.split("/").at(-1);
    const exception = temporaryAllowlist.get(advisoryId);
    const approved =
      exception?.packageName === packageName && exception.expires >= today;
    if (approved) {
      activeExceptions.push({ advisoryId, ...exception });
    }
    return !approved;
  });

  if (unapproved.length > 0) {
    blockedPackages.add(packageName);
  }
}

let changed = true;
while (changed) {
  changed = false;
  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    if (
      blockedPackages.has(packageName) ||
      !["high", "critical"].includes(vulnerability.severity)
    ) {
      continue;
    }
    const blockedDependency = vulnerability.via.some(
      (entry) => typeof entry === "string" && blockedPackages.has(entry),
    );
    if (blockedDependency) {
      blockedPackages.add(packageName);
      changed = true;
    }
  }
}

if (blockedPackages.size > 0) {
  console.error(
    `High-severity production audit failed: ${[...blockedPackages].sort().join(", ")}`,
  );
  process.exit(1);
}

const exceptions = [
  ...new Map(
    activeExceptions.map((exception) => [exception.advisoryId, exception]),
  ).values(),
];

console.log("High-severity web production audit passed.");
exceptions.forEach((exception) => {
  console.log(
    `Temporary exception ${exception.advisoryId} expires ${exception.expires}: ${exception.reason}`,
  );
});
