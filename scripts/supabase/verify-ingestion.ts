import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assessExtractionConfidence,
  extractSizeChart,
  rowPassesSanity,
} from "@rober/api-client/ingest";
import { createClient } from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(credentials.url, credentials.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const runId = randomUUID();
  const brandSlug = `stage4-verification-${runId}`;
  const domain = "stage4-verification.invalid";
  const sourceUrl = `https://${domain}/${runId}/size-guide`;
  const snapshotPath = `${domain}/${runId}/fixture.html`;
  const changedSnapshotPath = `${domain}/${runId}/fixture-v2.html`;
  const sourceIds: string[] = [];

  const html = readFileSync(
    resolve(
      process.cwd(),
      "packages/api-client/tests/fixtures/size-charts/levis.html",
    ),
    "utf8",
  );

  try {
    const extraction = await extractSizeChart({
      html,
      sourceUrl,
      brandName: "Stage 4 Verification Denim",
      modelName: "Fixture 505",
    });
    const rows = extraction.rows.filter(rowPassesSanity);
    assert(rows.length === 6, "Golden fixture did not yield six bounded rows.");
    const assessment = assessExtractionConfidence({
      extraction: { ...extraction, rows },
      sourceKind: "official",
    });
    assert(
      assessment.status === "published" && assessment.confidence >= 0.7,
      "Golden fixture did not clear the publication threshold.",
    );

    const blockedPublish = await anonymous.rpc(
      "publish_size_chart_extraction",
      {
        p_source: {},
        p_rows: [],
      },
    );
    assert(
      Boolean(blockedPublish.error),
      "Anonymous users can invoke the publication RPC.",
    );
    const blockedClaim = await anonymous.rpc("claim_ingestion_jobs", {
      p_worker_id: "unauthorized-probe",
      p_limit: 1,
    });
    assert(
      Boolean(blockedClaim.error),
      "Anonymous users can claim ingestion jobs.",
    );

    const snapshotUpload = await admin.storage
      .from("size-chart-snapshots")
      .upload(snapshotPath, html, {
        contentType: "text/html; charset=utf-8",
        upsert: false,
      });
    assert(!snapshotUpload.error, "Private fixture snapshot upload failed.");

    const publication = await admin.rpc("publish_size_chart_extraction", {
      p_source: {
        brandName: "Stage 4 Verification Denim",
        brandSlug,
        modelName: "Fixture 505",
        category: "jeans",
        sourceUrl,
        snapshotPath,
        fetchMethod: "http",
        parseMethod: extraction.method,
        confidence: assessment.confidence,
        status: assessment.status,
        contentHash: createHash("sha256").update(html).digest("hex"),
        fetchedAt: new Date().toISOString(),
        sourceKind: "official",
        measurementBasis: extraction.measurementBasis,
        detectedUnit: extraction.detectedUnit,
        needsReview: assessment.needsReview,
        metadata: { verificationRun: true, parserVersion: "fixture-v1" },
      },
      p_rows: rows.map((row) => ({
        sizeLabel: row.sizeLabel,
        spec: row.spec,
        evidence: row.evidence,
      })),
    });
    assert(
      !publication.error && typeof publication.data === "string",
      "Atomic fixture publication failed.",
    );
    const firstSourceId = publication.data;
    sourceIds.push(firstSourceId);

    const sourceRecord = await admin
      .from("size_chart_sources")
      .select(
        "id,status,confidence,source_domain,version,raw_snapshot_path,needs_review",
      )
      .eq("id", firstSourceId)
      .single();
    assert(!sourceRecord.error, "Published source record could not be read.");
    assert(
      sourceRecord.data.status === "published" &&
        sourceRecord.data.source_domain === domain &&
        sourceRecord.data.version === 1 &&
        sourceRecord.data.raw_snapshot_path === snapshotPath,
      "Published source provenance is incomplete.",
    );

    const publicSource = await anonymous
      .from("size_chart_sources")
      .select("id")
      .eq("id", firstSourceId);
    assert(
      !publicSource.error && publicSource.data.length === 1,
      "Anonymous clients cannot read the published fixture.",
    );
    const publicRows = await anonymous
      .from("garment_reference_catalog")
      .select("id,size_label")
      .eq("brand_slug", brandSlug);
    assert(
      !publicRows.error && publicRows.data.length === 6,
      "Published fixture rows are not visible through catalog RLS.",
    );

    const reparsedPublication = await admin.rpc(
      "publish_size_chart_extraction",
      {
        p_source: {
          brandName: "Stage 4 Verification Denim",
          brandSlug,
          modelName: "Fixture 505",
          category: "jeans",
          sourceUrl,
          snapshotPath,
          fetchMethod: "http",
          parseMethod: extraction.method,
          confidence: assessment.confidence,
          status: assessment.status,
          contentHash: createHash("sha256").update(html).digest("hex"),
          fetchedAt: new Date().toISOString(),
          sourceKind: "official",
          measurementBasis: extraction.measurementBasis,
          detectedUnit: extraction.detectedUnit,
          needsReview: assessment.needsReview,
          metadata: { verificationRun: true, parserVersion: "fixture-v2" },
        },
        p_rows: rows.map((row) => ({
          sizeLabel: row.sizeLabel,
          spec: row.spec,
          evidence: row.evidence,
        })),
      },
    );
    assert(
      !reparsedPublication.error &&
        typeof reparsedPublication.data === "string" &&
        reparsedPublication.data !== firstSourceId,
      "A parser revision did not create a new source version.",
    );
    const reparsedSourceId = reparsedPublication.data;
    sourceIds.push(reparsedSourceId);
    const reparsedSource = await admin
      .from("size_chart_sources")
      .select("version,supersedes_source_id,metadata_json")
      .eq("id", reparsedSourceId)
      .single();
    assert(
      !reparsedSource.error &&
        reparsedSource.data.version === 2 &&
        reparsedSource.data.supersedes_source_id === firstSourceId &&
        reparsedSource.data.metadata_json &&
        typeof reparsedSource.data.metadata_json === "object" &&
        !Array.isArray(reparsedSource.data.metadata_json) &&
        reparsedSource.data.metadata_json.parserVersion === "fixture-v2",
      "Parser revision provenance is incomplete.",
    );
    const supersededSource = await admin
      .from("size_chart_sources")
      .select("status,metadata_json")
      .eq("id", firstSourceId)
      .single();
    assert(
      !supersededSource.error &&
        supersededSource.data.status === "rejected" &&
        supersededSource.data.metadata_json &&
        typeof supersededSource.data.metadata_json === "object" &&
        !Array.isArray(supersededSource.data.metadata_json) &&
        supersededSource.data.metadata_json.supersededByParserVersion ===
          "fixture-v2",
      "The previous parser version remained public.",
    );

    const changedHtml = html.replace(
      "</body>",
      "<!-- verified source revision --></body>",
    );
    const changedUpload = await admin.storage
      .from("size-chart-snapshots")
      .upload(changedSnapshotPath, changedHtml, {
        contentType: "text/html; charset=utf-8",
        upsert: false,
      });
    assert(!changedUpload.error, "Changed fixture snapshot upload failed.");
    const changedAssessment = assessExtractionConfidence({
      extraction: { ...extraction, rows },
      sourceKind: "official",
      contentChanged: true,
    });
    assert(
      changedAssessment.needsReview,
      "Changed source content was not flagged for review.",
    );
    const changedPublication = await admin.rpc(
      "publish_size_chart_extraction",
      {
        p_source: {
          brandName: "Stage 4 Verification Denim",
          brandSlug,
          modelName: "Fixture 505",
          category: "jeans",
          sourceUrl,
          snapshotPath: changedSnapshotPath,
          fetchMethod: "http",
          parseMethod: extraction.method,
          confidence: changedAssessment.confidence,
          status: changedAssessment.status,
          contentHash: createHash("sha256").update(changedHtml).digest("hex"),
          fetchedAt: new Date().toISOString(),
          sourceKind: "official",
          measurementBasis: extraction.measurementBasis,
          detectedUnit: extraction.detectedUnit,
          needsReview: changedAssessment.needsReview,
          metadata: {
            verificationRun: true,
            changedContent: true,
            parserVersion: "fixture-v2",
          },
        },
        p_rows: rows.map((row) => ({
          sizeLabel: row.sizeLabel,
          spec: row.spec,
          evidence: row.evidence,
        })),
      },
    );
    assert(
      !changedPublication.error && typeof changedPublication.data === "string",
      "Changed fixture version could not be published.",
    );
    const changedSourceId = changedPublication.data;
    sourceIds.push(changedSourceId);
    const changedSource = await admin
      .from("size_chart_sources")
      .select("version,supersedes_source_id,needs_review")
      .eq("id", changedSourceId)
      .single();
    assert(
      !changedSource.error &&
        changedSource.data.version === 3 &&
        changedSource.data.supersedes_source_id === reparsedSourceId &&
        changedSource.data.needs_review,
      "Changed hash did not create a flagged source version.",
    );

    const anonymousTakedown = await anonymous.rpc(
      "takedown_size_chart_source",
      { p_source_id: changedSourceId, p_reason: "unauthorized probe" },
    );
    assert(
      Boolean(anonymousTakedown.error),
      "Anonymous users can invoke source takedown.",
    );

    const takedown = await admin.rpc("takedown_size_chart_source", {
      p_source_id: changedSourceId,
      p_reason: "Automated Stage 4 verification",
    });
    assert(
      !takedown.error && takedown.data === true,
      "Service-role takedown failed.",
    );
    const hiddenSource = await anonymous
      .from("size_chart_sources")
      .select("id")
      .in("id", sourceIds);
    const hiddenRows = await anonymous
      .from("garment_reference_catalog")
      .select("id")
      .eq("brand_slug", brandSlug);
    assert(
      !hiddenSource.error && hiddenSource.data.length === 0,
      "Takedown did not hide the chart source immediately.",
    );
    assert(
      !hiddenRows.error && hiddenRows.data.length === 0,
      "Takedown did not hide linked reference rows immediately.",
    );
    const block = await admin
      .from("ingestion_domain_blocks")
      .select("domain")
      .eq("domain", domain)
      .single();
    assert(!block.error, "Takedown did not block the source domain.");

    console.log(
      JSON.stringify({
        status: "ok",
        parsedRows: rows.length,
        confidence: assessment.confidence,
        parserRevisionVersioned: true,
        changedHashVersion: 3,
        changedHashFlagged: true,
        publicationVisible: true,
        takedownHidden: true,
        domainBlocked: true,
      }),
    );
  } finally {
    await admin
      .from("garment_reference_catalog")
      .delete()
      .eq("brand_slug", brandSlug);
    if (sourceIds.length > 0) {
      await admin.from("size_charts").delete().in("source_id", sourceIds);
      await admin.from("styles").delete().in("size_chart_source_id", sourceIds);
      await admin.from("size_chart_sources").delete().in("id", sourceIds);
    }
    await admin.from("ingestion_domain_blocks").delete().eq("domain", domain);
    await admin.from("brands").delete().eq("slug", brandSlug);
    await admin.storage
      .from("size-chart-snapshots")
      .remove([snapshotPath, changedSnapshotPath]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
