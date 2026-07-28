import { cn } from "@/lib/utils";

export function OnboardingProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-label="Reference pair setup"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={current}
      aria-valuetext={`Step ${current} of 3`}
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={cn(
            "h-1 rounded-full transition-[width,background-color] duration-200",
            step === current ? "w-8 bg-primary" : "w-4 bg-border",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
