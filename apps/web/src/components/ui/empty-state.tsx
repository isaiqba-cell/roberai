import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-start justify-center border-y border-border py-10",
        className,
      )}
    >
      <div className="mb-6 flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {icon ?? <SearchX aria-hidden="true" className="size-5" />}
      </div>
      <h2 className="font-serif text-3xl leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-lg font-sans text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
