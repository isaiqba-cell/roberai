"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderProps = {
  label: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  valueLabel?: string;
  className?: string;
};

export function Slider({
  className,
  defaultValue,
  label,
  max = 100,
  min = 0,
  onValueChange,
  onValueCommit,
  step = 1,
  value,
  valueLabel,
}: SliderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4 font-sans text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        {valueLabel ? (
          <span className="text-muted-foreground">{valueLabel}</span>
        ) : null}
      </div>
      <SliderPrimitive.Root
        className="relative flex h-6 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        {...(defaultValue ? { defaultValue } : {})}
        {...(value ? { value } : {})}
        {...(onValueChange ? { onValueChange } : {})}
        {...(onValueCommit ? { onValueCommit } : {})}
      >
        <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-pill bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          className="block size-5 rounded-full border-2 border-primary bg-background shadow-sm transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
