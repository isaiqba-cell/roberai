"use client";

import { useEffect, useState } from "react";

type CatalogMode = "checking" | "live" | "seed" | "unavailable";

export function CatalogStatusBadge() {
  const [mode, setMode] = useState<CatalogMode>("checking");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/catalog/status", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog status unavailable");
        const status = (await response.json()) as { mode?: unknown };
        setMode(status.mode === "live" ? "live" : "seed");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMode("unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  const label =
    mode === "live"
      ? "Live catalog"
      : mode === "seed"
        ? "Demo catalog"
        : mode === "unavailable"
          ? "Catalog unavailable"
          : "Checking catalog";

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <span
        className={`size-2 rounded-full ${
          mode === "unavailable" ? "bg-destructive" : "bg-fit-high"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
