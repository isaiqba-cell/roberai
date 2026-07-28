"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastInput = {
  title: string;
  description?: string;
  tone?: "default" | "success";
  theme?: "light" | "dark";
};

type ToastMessage = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const nextId = useRef(0);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((input: ToastInput) => {
    nextId.current += 1;
    setMessages((current) => [...current, { id: nextId.current, ...input }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4200}>
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            defaultOpen
            data-theme={message.theme}
            onOpenChange={(open) => {
              if (!open) {
                setMessages((current) =>
                  current.filter((item) => item.id !== message.id),
                );
              }
            }}
            className={cn(
              "grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 rounded-card border border-border bg-card p-4 text-card-foreground shadow-xl",
              "data-[state=closed]:animate-out data-[state=open]:animate-in",
            )}
          >
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Check aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <ToastPrimitive.Title className="font-sans text-sm font-bold text-foreground">
                {message.title}
              </ToastPrimitive.Title>
              {message.description ? (
                <ToastPrimitive.Description className="mt-1 font-sans text-sm leading-5 text-muted-foreground">
                  {message.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close asChild>
              <Button
                aria-label="Dismiss notification"
                title="Dismiss"
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-2 size-9"
              >
                <X aria-hidden="true" />
              </Button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-6 right-6 z-[70] flex w-[min(calc(100vw-32px),380px)] flex-col gap-3 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
