import { FIT_BANDS } from "@rober/fit-engine";

import { getConfidenceBand, type ConfidenceBand } from "@/lib/fit-band";
import { cn } from "@/lib/utils";

export { getConfidenceBand } from "@/lib/fit-band";

const shortLabels: Record<ConfidenceBand, string> = {
  high: "Great fit",
  medium: "Good fit",
  low: "Review fit",
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const band = getConfidenceBand(confidence);

  return (
    <span
      aria-label={`${confidence}% fit confidence, ${FIT_BANDS[band].label}`}
      data-band={band}
      className={cn(
        "inline-flex h-8 items-center rounded-pill px-3 font-sans text-xs font-bold",
        band === "high" && "bg-fit-high-soft text-fit-high",
        band === "medium" && "bg-fit-medium-soft text-fit-medium",
        band === "low" && "bg-fit-low-soft text-fit-low",
        className,
      )}
    >
      {confidence}% · {shortLabels[band]}
    </span>
  );
}
