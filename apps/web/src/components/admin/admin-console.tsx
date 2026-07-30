"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  Check,
  CheckCircle2,
  CircleAlert,
  Database,
  ExternalLink,
  FileSearch,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type {
  AdminDashboardData,
  AdminMeasurementSpec,
  AdminReviewRow,
  AdminReviewSource,
} from "@/lib/admin/dashboard";
import { cn } from "@/lib/utils";

type AdminView = "review" | "jobs" | "health";
type MutationState = { id: string; label: string } | null;

const editableDimensions = [
  { key: "waistCm", label: "Waist" },
  { key: "hipCm", label: "Hip" },
  { key: "thighCm", label: "Thigh" },
  { key: "riseCm", label: "Rise" },
  { key: "inseamCm", label: "Inseam" },
  { key: "legOpeningCm", label: "Opening" },
  { key: "stretchPct", label: "Stretch %" },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: string) {
  if (status === "published" || status === "completed") {
    return "bg-fit-high-soft text-fit-high";
  }
  if (status === "failed" || status === "rejected") {
    return "bg-destructive/10 text-destructive";
  }
  if (status === "processing") {
    return "bg-primary-soft text-primary";
  }
  return "bg-muted text-muted-foreground";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-pill px-2.5 text-xs font-bold capitalize",
        statusClasses(status),
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l border-border pl-4 first:border-l-0 first:pl-0">
      <dt className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-3xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function CoverageBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-muted">
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SourceList({
  sources,
  selectedId,
  onSelect,
}: {
  sources: AdminReviewSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-bold uppercase text-primary">Review queue</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sources.length} source{sources.length === 1 ? "" : "s"} flagged
        </p>
      </div>
      <div className="max-h-[46rem] overflow-y-auto">
        {sources.map((source) => (
          <button
            key={source.id}
            type="button"
            aria-pressed={selectedId === source.id}
            onClick={() => onSelect(source.id)}
            className={cn(
              "block w-full border-b border-border px-4 py-4 text-left outline-none transition-colors last:border-b-0 hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              selectedId === source.id && "bg-primary-soft",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold">{source.brandName}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {source.modelName}
                </span>
              </span>
              <span className="text-xs font-bold tabular-nums text-primary">
                {Math.round(source.confidence * 100)}%
              </span>
            </span>
            <span className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{source.sourceDomain}</span>
              <span aria-hidden="true">·</span>
              <span>{source.rows.length} rows</span>
            </span>
          </button>
        ))}
        {sources.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto size-6 text-fit-high" />
            <p className="mt-3 font-semibold">Queue clear</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No chart sources need review.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MeasurementTable({
  rows,
  onChange,
}: {
  rows: AdminReviewRow[];
  onChange: (index: number, spec: AdminMeasurementSpec) => void;
}) {
  return (
    <div className="overflow-x-auto border border-border bg-background">
      <table className="min-w-[58rem] border-collapse text-sm">
        <thead className="bg-muted text-left text-xs uppercase text-foreground">
          <tr>
            <th className="px-3 py-3">Size</th>
            {editableDimensions.map((dimension) => (
              <th key={dimension.key} className="px-2 py-3">
                {dimension.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.entryId} className="border-t border-border">
              <th className="px-3 py-2 text-left font-bold">{row.sizeLabel}</th>
              {editableDimensions.map((dimension) => (
                <td key={dimension.key} className="px-2 py-2">
                  <input
                    aria-label={`${row.sizeLabel} ${dimension.label}`}
                    inputMode="decimal"
                    value={
                      typeof row.spec[dimension.key] === "number"
                        ? String(row.spec[dimension.key])
                        : ""
                    }
                    onChange={(event) => {
                      const next = { ...row.spec };
                      if (event.target.value === "") {
                        delete next[dimension.key];
                      } else {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) next[dimension.key] = value;
                      }
                      onChange(index, next);
                    }}
                    className="h-9 w-20 rounded-sm border border-border bg-background px-2 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No parsed rows were attached to this source.
        </p>
      ) : null}
    </div>
  );
}

function ReviewWorkspace({
  source,
  onCompleted,
}: {
  source: AdminReviewSource | null;
  onCompleted: (sourceId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminReviewRow[]>(source?.rows ?? []);
  const [reason, setReason] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [snapshotState, setSnapshotState] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >(source?.rawSnapshotAvailable ? "loading" : "unavailable");
  const [mutation, setMutation] = useState<MutationState>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!source?.rawSnapshotAvailable) return;

    const controller = new AbortController();
    fetch(`/api/admin/sources/${source.id}/snapshot`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Snapshot unavailable");
        return (await response.json()) as {
          excerpt: string | null;
          available: boolean;
        };
      })
      .then((payload) => {
        setSnapshot(payload.excerpt);
        setSnapshotState(payload.available ? "ready" : "unavailable");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setSnapshot(null);
        setSnapshotState("unavailable");
      });
    return () => controller.abort();
  }, [source]);

  if (!source) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center border border-border bg-background px-6 text-center">
        <div>
          <ShieldCheck className="mx-auto size-8 text-fit-high" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">
            No source selected
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The review queue is currently clear.
          </p>
        </div>
      </div>
    );
  }

  const activeSource = source;

  async function submit(action: "approve" | "reject" | "takedown") {
    if ((action === "reject" || action === "takedown") && reason.length < 4) {
      setMessage("Add a short reason before removing a source.");
      return;
    }

    setMutation({ id: action, label: `${action} source` });
    setMessage(null);
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "takedown"
          ? {
              action: "takedown_source",
              sourceId: activeSource.id,
              reason,
            }
          : {
              action: "review_source",
              sourceId: activeSource.id,
              decision: action,
              rows,
              reason: reason || undefined,
            },
      ),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    setMutation(null);
    if (!response.ok) {
      setMessage(payload?.error ?? "The operation did not complete.");
      return;
    }

    onCompleted(activeSource.id);
    router.refresh();
  }

  return (
    <section
      className="border border-border bg-background"
      aria-labelledby="source-title"
    >
      <header className="border-b border-border px-5 py-5 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              {source.origin} · {source.sourceKind}
            </p>
            <h2
              id="source-title"
              className="mt-1 font-serif text-3xl font-semibold"
            >
              {source.brandName} {source.modelName}
            </h2>
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener nofollow"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {source.sourceDomain}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl font-semibold tabular-nums">
              {Math.round(source.confidence * 100)}%
            </p>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              extraction confidence
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusPill status={source.status} />
          <span className="rounded-pill border border-border px-2.5 py-1 text-xs font-semibold">
            {source.parseMethod} parse
          </span>
          <span className="rounded-pill border border-border px-2.5 py-1 text-xs font-semibold">
            {source.measurementBasis} measurements
          </span>
          <span className="rounded-pill border border-border px-2.5 py-1 text-xs font-semibold">
            {source.detectedUnit}
          </span>
          <span className="rounded-pill border border-border px-2.5 py-1 text-xs font-semibold">
            fetched {formatDate(source.fetchedAt)}
          </span>
        </div>
        {source.flags.length ? (
          <div className="mt-4 flex gap-3 border-l-2 border-fit-medium bg-fit-medium-soft px-3 py-2 text-sm text-fit-medium">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <p>{source.flags.join(" · ")}</p>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.35fr)] lg:px-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Archived evidence
              </p>
              <h3 className="mt-1 font-serif text-xl font-semibold">
                Raw snapshot
              </h3>
            </div>
            <FileSearch aria-hidden="true" className="size-5 text-primary" />
          </div>
          <div className="h-[29rem] overflow-y-auto border border-border bg-muted/50 p-4">
            {snapshotState === "loading" ? (
              <div className="space-y-3" aria-label="Loading archived snapshot">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-3 animate-pulse bg-border motion-reduce:animate-none"
                    style={{ width: `${68 + ((index * 17) % 30)}%` }}
                  />
                ))}
              </div>
            ) : snapshot ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {snapshot}
              </p>
            ) : (
              <div className="flex h-full items-center justify-center px-5 text-center text-sm text-muted-foreground">
                This seeded or legacy source has no archived HTML snapshot.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Normalized output
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold">
              Parsed rows · centimeters
            </h3>
          </div>
          <MeasurementTable
            rows={rows}
            onChange={(index, spec) => {
              setRows((current) =>
                current.map((row, rowIndex) =>
                  rowIndex === index ? { ...row, spec } : row,
                ),
              );
            }}
          />
          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Review note
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Required for reject and takedown"
              maxLength={1_000}
              className="mt-2 min-h-24 w-full resize-y rounded-sm border border-border bg-background px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {message ? (
            <p
              role="status"
              className="mt-3 text-sm font-semibold text-destructive"
            >
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => submit("approve")}
              disabled={Boolean(mutation)}
            >
              {mutation?.id === "approve" ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Check />
              )}
              Publish at 100%
            </Button>
            <Button
              variant="outline"
              onClick={() => submit("reject")}
              disabled={Boolean(mutation)}
            >
              <X />
              Reject
            </Button>
            <Button
              variant="destructive"
              onClick={() => submit("takedown")}
              disabled={Boolean(mutation)}
            >
              <Ban />
              Takedown domain
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function JobsView({
  data,
  onRetry,
}: {
  data: AdminDashboardData;
  onRetry: (jobId: string) => void;
}) {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mutation, setMutation] = useState<MutationState>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function enqueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMutation({ id: "enqueue", label: "Queue source" });
    setMessage(null);
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enqueue_ingestion",
        brandName,
        modelName,
        sourceUrl,
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    setMutation(null);
    if (!response.ok) {
      setMessage(payload?.error ?? "The source could not be queued.");
      return;
    }
    setBrandName("");
    setModelName("");
    setSourceUrl("");
    setMessage("Source queued for ingestion.");
    router.refresh();
  }

  async function retry(jobId: string) {
    setMutation({ id: jobId, label: "Retry job" });
    setMessage(null);
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry_job", jobId }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    setMutation(null);
    if (!response.ok) {
      setMessage(payload?.error ?? "The job could not be retried.");
      return;
    }
    onRetry(jobId);
    setMessage("Job moved back to the queue.");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="border border-border bg-background px-5 py-5">
        <p className="text-xs font-bold uppercase text-primary">
          Manual ingestion
        </p>
        <h2 className="mt-1 font-serif text-2xl font-semibold">
          Index a source
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add an official chart target. The worker still respects robots, fetch
          policy, confidence checks, and source versioning. Body-size charts are
          stored as reference evidence and never treated as garment
          construction.
        </p>
        <form onSubmit={enqueue} className="mt-6 space-y-4">
          {[
            {
              label: "Brand",
              value: brandName,
              setValue: setBrandName,
              placeholder: "Levi's",
              type: "text",
            },
            {
              label: "Model",
              value: modelName,
              setValue: setModelName,
              placeholder: "505 Regular",
              type: "text",
            },
            {
              label: "Official source URL (optional)",
              value: sourceUrl,
              setValue: setSourceUrl,
              placeholder: "https://…",
              type: "url",
            },
          ].map((field) => (
            <label key={field.label} className="block">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                {field.label}
              </span>
              <input
                required={field.label !== "Official source URL (optional)"}
                type={field.type}
                value={field.value}
                onChange={(event) => field.setValue(event.target.value)}
                placeholder={field.placeholder}
                className="mt-2 h-11 w-full rounded-sm border border-border bg-background px-3 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ))}
          <Button type="submit" className="w-full" disabled={Boolean(mutation)}>
            {mutation?.id === "enqueue" ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Play />
            )}
            Queue source
          </Button>
          {message ? (
            <p
              role="status"
              className="text-sm font-semibold text-muted-foreground"
            >
              {message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="min-w-0" aria-labelledby="jobs-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              Worker queue
            </p>
            <h2
              id="jobs-title"
              className="mt-1 font-serif text-2xl font-semibold"
            >
              Recent ingestion jobs
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {data.jobs.length} shown
          </span>
        </div>
        <div className="overflow-x-auto border border-border bg-background">
          <table className="min-w-[48rem] w-full border-collapse text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-foreground">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job.id} className="border-t border-border align-top">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-semibold">{job.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.type.replaceAll("_", " ")}
                    </p>
                    {job.lastError ? (
                      <p className="mt-2 line-clamp-2 text-xs text-destructive">
                        {job.lastError}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={job.status} />
                  </td>
                  <td className="px-4 py-4 tabular-nums text-muted-foreground">
                    {job.attempts}/{job.maxAttempts}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatTime(job.updatedAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {job.status === "failed" || job.status === "cancelled" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retry(job.id)}
                        disabled={Boolean(mutation)}
                      >
                        <RefreshCw
                          className={cn(
                            mutation?.id === job.id &&
                              "animate-spin motion-reduce:animate-none",
                          )}
                        />
                        Retry
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HealthView({ data }: { data: AdminDashboardData }) {
  const funnel = [
    ["Anchors created", data.funnel.anchorsCreated],
    ["Matches viewed", data.funnel.matchesViewed],
    ["Slider used", data.funnel.sliderUsed],
    ["Saved", data.funnel.saves],
    ["Outbound clicks", data.funnel.outboundClicks],
  ] as const;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="border border-border bg-background px-5 py-5 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              Index health
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">
              Measurement coverage
            </h2>
          </div>
          <Database aria-hidden="true" className="size-5 text-primary" />
        </div>
        <div className="mt-7 space-y-6">
          <CoverageBar
            label="Rise dimensions"
            value={data.health.riseCoverage}
          />
          <CoverageBar
            label="Thigh dimensions"
            value={data.health.thighCoverage}
          />
          <CoverageBar
            label="Product imagery"
            value={data.health.imageCoverage}
          />
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-border pt-6 sm:grid-cols-3">
          <Metric label="Sources" value={data.health.sources} />
          <Metric label="Published" value={data.health.publishedSources} />
          <Metric label="Stale" value={data.health.staleSources} />
        </dl>
      </section>

      <section className="border border-border bg-background px-5 py-5 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              Last 30 days
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">
              Core funnel
            </h2>
          </div>
          <Activity aria-hidden="true" className="size-5 text-primary" />
        </div>
        <div className="mt-7 divide-y divide-border">
          {funnel.map(([label, value], index) => (
            <div
              key={label}
              className="flex items-center gap-4 py-3 first:pt-0"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1 font-semibold">{label}</span>
              <span className="font-serif text-xl font-semibold tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border bg-background lg:col-span-2">
        <div className="border-b border-border px-5 py-5 lg:px-6">
          <p className="text-xs font-bold uppercase text-primary">
            Audit trail
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold">
            Recent operator changes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[42rem] w-full border-collapse text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-foreground">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.audits.map((audit) => (
                <tr key={audit.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">
                    {audit.action.replaceAll(".", " · ")}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {audit.targetTable}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {audit.targetId.slice(0, 12)}…
                  </td>
                  <td className="px-5 py-4 text-right text-muted-foreground">
                    {formatTime(audit.createdAt)}
                  </td>
                </tr>
              ))}
              {data.audits.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    The audit trail begins with the first admin mutation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AdminConsole({
  initialData,
  operatorEmail,
}: {
  initialData: AdminDashboardData;
  operatorEmail: string;
}) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<AdminView>("review");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    initialData.reviewQueue[0]?.id ?? null,
  );

  const selectedSource = useMemo(
    () =>
      data.reviewQueue.find((source) => source.id === selectedSourceId) ?? null,
    [data.reviewQueue, selectedSourceId],
  );

  return (
    <div className="mx-auto max-w-shell px-5 py-10 lg:px-8 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-7">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            Rober operations
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">
            Denim index control room
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Review provenance, operate ingestion, and watch the fit index
            without exposing raw customer measurements.
          </p>
        </div>
        <div className="ml-auto max-w-[18rem] text-right text-sm text-muted-foreground">
          <p
            className="truncate font-semibold text-foreground"
            title={operatorEmail}
          >
            {operatorEmail}
          </p>
          <p className="mt-1">Refreshed {formatTime(data.generatedAt)}</p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-7 border-b border-border py-7 sm:grid-cols-4">
        <Metric label="Brands" value={data.health.brands} />
        <Metric label="Styles" value={data.health.products} />
        <Metric
          label="Size options"
          value={data.health.variants.toLocaleString()}
        />
        <Metric label="Needs review" value={data.health.reviewQueue} />
      </dl>

      <div
        className="my-7 flex gap-2 overflow-x-auto"
        role="tablist"
        aria-label="Admin views"
      >
        {(
          [
            ["review", "Review queue", FileSearch],
            ["jobs", "Ingestion jobs", RefreshCw],
            ["health", "Health & funnel", Activity],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-pill border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              view === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "review" ? (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <SourceList
            sources={data.reviewQueue}
            selectedId={selectedSourceId}
            onSelect={setSelectedSourceId}
          />
          <ReviewWorkspace
            key={selectedSource?.id ?? "empty-review-queue"}
            source={selectedSource}
            onCompleted={(sourceId) => {
              setData((current) => ({
                ...current,
                health: {
                  ...current.health,
                  reviewQueue: Math.max(0, current.health.reviewQueue - 1),
                },
                reviewQueue: current.reviewQueue.filter(
                  (source) => source.id !== sourceId,
                ),
              }));
            }}
          />
        </div>
      ) : null}
      {view === "jobs" ? (
        <JobsView
          data={data}
          onRetry={(jobId) => {
            setData((current) => ({
              ...current,
              jobs: current.jobs.map((job) =>
                job.id === jobId
                  ? { ...job, status: "pending", attempts: 0, lastError: null }
                  : job,
              ),
            }));
          }}
        />
      ) : null}
      {view === "health" ? <HealthView data={data} /> : null}
    </div>
  );
}
