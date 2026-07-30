"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LoaderCircle, Ruler } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import {
  readGuestSavedItems,
  writeGuestSavedItems,
  type SavedMatch,
} from "@/lib/saved-items";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function SavedGallery() {
  const { loading: authLoading, user } = useAuth();
  const [items, setItems] = useState<SavedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const frame = window.requestAnimationFrame(() => {
        setItems(readGuestSavedItems(window.localStorage));
        setLoading(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    void fetch("/api/saved", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Saved styles failed");
        const payload = (await response.json()) as { items: SavedMatch[] };
        setItems(payload.items);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        toast({
          title: "Saved styles are still syncing",
          description: "Your account list could not be loaded yet.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, toast, user]);

  async function remove(item: SavedMatch) {
    const previous = items;
    const next = items.filter(
      (candidate) => candidate.productId !== item.productId,
    );
    setItems(next);
    if (!user) {
      writeGuestSavedItems(window.localStorage, next);
      trackAnalyticsEvent({
        event: "save_toggled",
        properties: {
          productId: item.productId,
          saved: false,
          surface: "saved",
          authenticated: false,
        },
      });
      return;
    }

    const response = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.productId,
        variantId: item.variantId,
        saved: false,
      }),
    });
    if (!response.ok) {
      setItems(previous);
      toast({
        title: "Style stayed saved",
        description: "The account update did not finish. Try again.",
      });
      return;
    }
    trackAnalyticsEvent({
      event: "save_toggled",
      properties: {
        productId: item.productId,
        saved: false,
        surface: "saved",
        authenticated: true,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center" role="status">
        <LoaderCircle
          aria-hidden="true"
          className="size-6 animate-spin text-primary"
        />
        <span className="sr-only">Loading saved styles</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        className="mt-12"
        icon={<Heart aria-hidden="true" className="size-5" />}
        title="Nothing saved yet"
        description="Save a match to keep its recommended size, fit confidence, and comparison notes together."
        action={
          <Link
            href="/matches"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground"
          >
            Browse matches
          </Link>
        }
      />
    );
  }

  return (
    <>
      <section className="mt-10 grid gap-6 border-y border-border py-8 md:grid-cols-[0.75fr_1.25fr] md:items-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
          <Ruler aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-serif text-3xl">Saved with fit memory</h2>
          <p className="mt-2 max-w-2xl font-sans leading-7 text-muted-foreground">
            Every saved pair keeps its recommended size, fit score, and the
            reason it matches your reference garment.
          </p>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.productId} className="group min-w-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-card">
              <Link
                href={`/style/${item.productId}`}
                aria-label={`View ${item.brandName} ${item.title}`}
                className="absolute inset-0"
              >
                <Image
                  src={item.imageUrl}
                  alt={`${item.brandName} ${item.title}`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>
              <button
                type="button"
                onClick={() => void remove(item)}
                aria-label={`Remove ${item.title} from saved`}
                className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Heart
                  aria-hidden="true"
                  className="size-5"
                  fill="currentColor"
                />
              </button>
              <span className="absolute bottom-3 left-3 bg-card/95 px-2.5 py-1.5 font-sans text-xs font-bold backdrop-blur">
                Size {item.recommendedSize}
              </span>
            </div>
            <div className="pt-4">
              <p className="font-sans text-xs font-bold uppercase text-muted-foreground">
                {item.brandName}
              </p>
              <div className="mt-1 flex items-start justify-between gap-4">
                <h2 className="font-serif text-2xl leading-tight">
                  <Link
                    href={`/style/${item.productId}`}
                    className="hover:text-primary"
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="shrink-0 font-serif text-xl">
                  {money(item.priceCents)}
                </p>
              </div>
              <p className="mt-3 min-h-12 font-sans text-sm leading-6 text-muted-foreground">
                {item.reason}
              </p>
              {item.confidence > 0 ? (
                <ConfidenceBadge
                  className="mt-3"
                  confidence={item.confidence}
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
