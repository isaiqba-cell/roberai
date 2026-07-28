"use client";

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OverlayPanelProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  theme?: "light" | "dark";
};

function PanelContent({
  children,
  description,
  mode,
  theme,
  title,
}: Omit<OverlayPanelProps, "trigger"> & { mode: "dialog" | "sheet" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        data-theme={theme}
        className={cn(
          "fixed z-50 border border-border bg-card text-card-foreground shadow-2xl focus:outline-none",
          mode === "dialog" &&
            "left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-sheet p-7",
          mode === "sheet" &&
            "inset-y-0 right-0 w-[min(92vw,440px)] border-y-0 border-r-0 p-7",
        )}
      >
        <DialogPrimitive.Title className="pr-10 font-serif text-3xl leading-tight text-foreground">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-3 font-sans text-sm leading-6 text-muted-foreground">
          {description}
        </DialogPrimitive.Description>
        {children ? <div className="mt-7">{children}</div> : null}
        <DialogPrimitive.Close asChild>
          <Button
            aria-label="Close panel"
            title="Close"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function Dialog({ trigger, ...props }: OverlayPanelProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <PanelContent mode="dialog" {...props} />
    </DialogPrimitive.Root>
  );
}

export function Sheet({ trigger, ...props }: OverlayPanelProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <PanelContent mode="sheet" {...props} />
    </DialogPrimitive.Root>
  );
}
