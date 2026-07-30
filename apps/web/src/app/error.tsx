"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@sentry/react").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-5 py-20 text-center">
      <p className="font-sans text-xs font-bold uppercase text-primary">
        The page paused
      </p>
      <h1 className="mt-3 font-serif text-5xl">That did not load cleanly.</h1>
      <p className="mx-auto mt-5 max-w-lg font-sans leading-7 text-muted-foreground">
        Nothing was changed. Retry the page, and Rober will pick up from your
        saved fit memory.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mx-auto mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 font-sans text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        Try again
      </button>
    </section>
  );
}
