import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ChipProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  selected?: boolean;
};

export function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-pill border px-4 font-sans text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export const Toggle = Chip;
