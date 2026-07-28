import "server-only";

import {
  createIngestionDependencies,
  processIngestionJob,
} from "@/lib/ingestion/pipeline";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function failureMessage(error: unknown) {
  return (error instanceof Error ? error.message : "Unknown ingestion failure")
    .replace(/\s+/g, " ")
    .slice(0, 1_000);
}

export async function drainIngestionJobs({
  limit = 2,
  workerId = `web-${crypto.randomUUID()}`,
}: { limit?: number; workerId?: string } = {}) {
  const admin = createSupabaseAdminClient();
  const { error: scheduleError } = await admin.rpc(
    "enqueue_weekly_chart_refreshes",
    { p_limit: 25 },
  );
  if (scheduleError) {
    throw new Error("Weekly source refreshes could not be scheduled.");
  }

  const { data: jobs, error: claimError } = await admin.rpc(
    "claim_ingestion_jobs",
    { p_worker_id: workerId, p_limit: limit },
  );
  if (claimError) throw new Error("Ingestion jobs could not be claimed.");
  if (!jobs?.length) {
    return { claimed: 0, completed: 0, retried: 0, failed: 0, results: [] };
  }

  const dependencies = createIngestionDependencies(admin);
  const results: Array<{
    jobId: string;
    status: "completed" | "retried" | "failed";
    sourceId?: string;
  }> = [];

  for (const job of jobs) {
    try {
      const result = await processIngestionJob(job, dependencies);
      const { error } = await admin
        .from("jobs")
        .update({
          status: "completed",
          last_error: null,
          locked_at: null,
          locked_by: null,
        })
        .eq("id", job.id);
      if (error) throw new Error("A completed job could not be acknowledged.");
      results.push({
        jobId: job.id,
        status: "completed",
        sourceId: result.sourceId,
      });
    } catch (error) {
      const exhausted = job.attempts >= job.max_attempts;
      const delaySeconds = Math.min(3_600, 60 * 2 ** (job.attempts - 1));
      const { error: updateError } = await admin
        .from("jobs")
        .update({
          status: exhausted ? "failed" : "pending",
          run_after: exhausted
            ? job.run_after
            : new Date(Date.now() + delaySeconds * 1_000).toISOString(),
          last_error: failureMessage(error),
          locked_at: null,
          locked_by: null,
        })
        .eq("id", job.id);
      if (updateError) {
        throw new Error("A failed ingestion job could not be released.");
      }
      results.push({
        jobId: job.id,
        status: exhausted ? "failed" : "retried",
      });
    }
  }

  return {
    claimed: jobs.length,
    completed: results.filter((result) => result.status === "completed").length,
    retried: results.filter((result) => result.status === "retried").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
