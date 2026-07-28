"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Database,
  Heart,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GarmentSpec } from "@rober/fit-engine";
import { silhouetteCutFromSlider } from "@rober/matching";

import { useAuth } from "@/components/auth/auth-provider";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toast";
import type {
  MatchCardData,
  MatchApiError,
  MatchesResponse,
} from "@/lib/matches/types";
import {
  readGuestSavedItems,
  toggleGuestSavedItem,
  type SavedMatch,
} from "@/lib/saved-items";
import { cn } from "@/lib/utils";

const priceCaps = [null, 6_000, 8_000, 10_000, 15_000] as const;

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function savedMatch(card: MatchCardData): SavedMatch {
  return {
    productId: card.id,
    variantId: card.variantId,
    brandName: card.brandName,
    title: card.title,
    imageUrl: card.imageUrl,
    priceCents: card.priceCents,
    recommendedSize: card.recommendedSize,
    confidence: card.confidence,
    reason: card.reason,
    savedAt: new Date().toISOString(),
  };
}

function SaveButton({
  card,
  saved,
  onToggle,
  className,
}: {
  card: MatchCardData;
  saved: boolean;
  onToggle: (card: MatchCardData) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={
        saved ? `Remove ${card.title} from saved` : `Save ${card.title}`
      }
      aria-pressed={saved}
      onClick={() => onToggle(card)}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className="size-5"
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}

function MatchImage({
  card,
  priority = false,
}: {
  card: MatchCardData;
  priority?: boolean;
}) {
  return (
    <Image
      src={card.imageUrl}
      alt={`${card.brandName} ${card.title}`}
      fill
      priority={priority}
      sizes={
        priority
          ? "(min-width: 1024px) 48vw, 100vw"
          : "(min-width: 1024px) 25vw, 50vw"
      }
      className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.02]"
    />
  );
}

function MatchHero({
  card,
  saved,
  onToggle,
}: {
  card: MatchCardData;
  saved: boolean;
  onToggle: (card: MatchCardData) => void;
}) {
  return (
    <motion.article
      layout
      className="overflow-hidden rounded-md border border-border bg-card lg:grid lg:grid-cols-[1.08fr_0.92fr]"
    >
      <Link
        href={`/style/${card.id}`}
        aria-label={`View ${card.brandName} ${card.title}`}
        className="group relative block aspect-[5/4] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[31rem]"
      >
        <motion.div
          layoutId={`product-image-${card.id}`}
          className="absolute inset-0"
        >
          <MatchImage card={card} priority />
        </motion.div>
        <span className="absolute left-5 top-5 bg-primary px-3 py-2 font-sans text-xs font-bold uppercase text-primary-foreground">
          Best match
        </span>
      </Link>

      <div className="flex flex-col justify-between p-7 lg:p-10">
        <div>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-sans text-xs font-bold uppercase text-primary">
                {card.brandName}
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-4xl leading-[1.02] lg:text-5xl">
                {card.title}
              </h2>
            </div>
            <SaveButton card={card} saved={saved} onToggle={onToggle} />
          </div>
          <p className="mt-6 max-w-lg font-serif text-xl leading-8 text-muted-foreground">
            {card.reason}
          </p>
          <dl className="mt-8 grid grid-cols-2 border-y border-border">
            <div className="border-r border-border py-5 pr-5">
              <dt className="font-sans text-xs font-bold uppercase text-muted-foreground">
                Size to buy
              </dt>
              <dd className="mt-2 font-serif text-3xl">
                {card.recommendedSize}
              </dd>
            </div>
            <div className="py-5 pl-5">
              <dt className="font-sans text-xs font-bold uppercase text-muted-foreground">
                Price
              </dt>
              <dd className="mt-2 font-serif text-3xl">
                {money(card.priceCents, card.currency)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ConfidenceBadge confidence={card.confidence} />
            <span className="font-sans text-xs text-muted-foreground">
              {card.availableSizeCount} indexed sizes
            </span>
          </div>
        </div>
        <Link
          href={`/style/${card.id}`}
          className="mt-9 inline-flex h-12 w-full items-center justify-between rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          See why it fits
          <ArrowUpRight aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </motion.article>
  );
}

function MatchCard({
  card,
  saved,
  onToggle,
}: {
  card: MatchCardData;
  saved: boolean;
  onToggle: (card: MatchCardData) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="group min-w-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-card">
        <Link
          href={`/style/${card.id}`}
          aria-label={`View ${card.brandName} ${card.title}`}
          className="absolute inset-0"
        >
          <motion.div
            layoutId={`product-image-${card.id}`}
            className="absolute inset-0"
          >
            <MatchImage card={card} />
          </motion.div>
        </Link>
        <SaveButton
          card={card}
          saved={saved}
          onToggle={onToggle}
          className="absolute right-3 top-3"
        />
        <span className="absolute bottom-3 left-3 bg-card/95 px-2.5 py-1.5 font-sans text-xs font-bold text-foreground backdrop-blur">
          Size {card.recommendedSize}
        </span>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-sans text-xs font-bold uppercase text-muted-foreground">
              {card.brandName}
            </p>
            <h3 className="mt-1 font-serif text-2xl leading-tight">
              <Link href={`/style/${card.id}`} className="hover:text-primary">
                {card.title}
              </Link>
            </h3>
          </div>
          <p className="shrink-0 font-serif text-xl">
            {money(card.priceCents, card.currency)}
          </p>
        </div>
        <p className="mt-3 min-h-12 font-sans text-sm leading-6 text-muted-foreground">
          {card.reason}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <ConfidenceBadge confidence={card.confidence} />
          <Link
            href={`/style/${card.id}`}
            className="font-sans text-xs font-bold text-primary underline-offset-4 hover:underline"
          >
            Fit details
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function MatchSkeletons() {
  return (
    <div className="space-y-12" role="status" aria-label="Finding your matches">
      <div className="h-[31rem] animate-pulse rounded-md border border-border bg-muted" />
      <div className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
            <div className="mt-4 h-5 w-2/3 animate-pulse bg-muted" />
            <div className="mt-3 h-4 w-full animate-pulse bg-muted" />
          </div>
        ))}
      </div>
      <span className="sr-only">Matching 5,000 indexed size options</span>
    </div>
  );
}

export function MatchesExperience({
  anchor,
  anchorLabel,
}: {
  anchor: GarmentSpec;
  anchorLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const [draftSilhouette, setDraftSilhouette] = useState(50);
  const [silhouette, setSilhouette] = useState(50);
  const [sort, setSort] = useState<"best" | "price">("best");
  const [priceCapCents, setPriceCapCents] = useState<number | null>(null);
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { loading: authLoading, user } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const controller = new AbortController();
      void fetch("/api/saved", { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return;
          const payload = (await response.json()) as { items: SavedMatch[] };
          setSavedIds(new Set(payload.items.map((item) => item.productId)));
        })
        .catch(() => undefined);
      return () => controller.abort();
    }
    const frame = window.requestAnimationFrame(() => {
      setSavedIds(
        new Set(
          readGuestSavedItems(window.localStorage).map(
            (item) => item.productId,
          ),
        ),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [authLoading, user]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anchor,
        silhouette,
        sort,
        priceCapCents,
        limit: 24,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          MatchesResponse | MatchApiError;
        if (!response.ok || "error" in payload) {
          throw new Error(
            "error" in payload ? payload.error : "Matches failed",
          );
        }
        setData(payload);
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The jeans index could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [anchor, priceCapCents, silhouette, sort]);

  const targetCut = silhouetteCutFromSlider(draftSilhouette);
  const results = useMemo(() => data?.matches ?? [], [data]);
  const best = results[0];
  const rest = useMemo(() => results.slice(1), [results]);

  function toggleSaved(card: MatchCardData) {
    const wasSaved = savedIds.has(card.id);
    if (user) {
      const optimistic = new Set(savedIds);
      if (wasSaved) optimistic.delete(card.id);
      else optimistic.add(card.id);
      setSavedIds(optimistic);
      void fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: card.id,
          variantId: card.variantId,
          saved: !wasSaved,
        }),
      }).then((response) => {
        if (response.ok) return;
        setSavedIds(savedIds);
        toast({
          title: "Saved list unchanged",
          description: "The account update did not finish. Try again.",
        });
      });
      return;
    }
    const next = toggleGuestSavedItem(window.localStorage, savedMatch(card));
    const nextIds = new Set(next.map((item) => item.productId));
    setSavedIds(nextIds);
    toast({
      title: wasSaved ? "Removed from saved" : "Saved with fit memory",
      description: wasSaved
        ? `${card.title} was removed.`
        : `Size ${card.recommendedSize} and the fit reason are saved.`,
    });
  }

  function requestSilhouette(value: number) {
    setLoading(true);
    setError(null);
    setSilhouette(value);
  }

  function requestSort(value: "best" | "price") {
    setLoading(true);
    setError(null);
    setSort(value);
  }

  function requestPriceCap(value: number | null) {
    setLoading(true);
    setError(null);
    setPriceCapCents(value);
  }

  return (
    <section aria-labelledby="match-results-heading" className="py-12">
      <div className="border-y border-border py-7 lg:sticky lg:top-[164px] lg:z-10 lg:bg-background/95 lg:backdrop-blur">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase text-primary">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Shape the result
              </p>
              <span
                aria-live="polite"
                className="font-serif text-lg capitalize"
              >
                {targetCut}
              </span>
            </div>
            <Slider
              className="mt-4"
              label="Silhouette"
              value={[draftSilhouette]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) => setDraftSilhouette(value ?? 50)}
              onValueCommit={([value]) => requestSilhouette(value ?? 50)}
              valueLabel="Release to reorder"
            />
            <div className="mt-1 flex justify-between font-sans text-xs text-muted-foreground">
              <span>Skinnier</span>
              <span>Like your pair</span>
              <span>Baggier</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              aria-pressed={sort === "best"}
              onClick={() => requestSort("best")}
              className={cn(
                "h-10 rounded-full border px-4 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sort === "best"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background",
              )}
            >
              Best match
            </button>
            <button
              type="button"
              aria-pressed={sort === "price"}
              onClick={() => requestSort("price")}
              className={cn(
                "h-10 rounded-full border px-4 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sort === "price"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background",
              )}
            >
              Lowest price
            </button>
            <label className="sr-only" htmlFor="price-cap">
              Maximum price
            </label>
            <select
              id="price-cap"
              value={priceCapCents ?? ""}
              onChange={(event) =>
                requestPriceCap(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="h-10 rounded-full border border-border bg-background px-4 font-sans text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {priceCaps.map((cap) => (
                <option key={cap ?? "all"} value={cap ?? ""}>
                  {cap === null ? "Any price" : `Under ${money(cap)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-10">
        {data ? (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase text-primary">
                <Database aria-hidden="true" className="size-4" />
                {data.mode === "live" ? "Live jeans index" : "Preview index"}
              </p>
              <h2
                id="match-results-heading"
                className="mt-2 font-serif text-4xl"
              >
                {data.totalEligible} pairs fit this direction
              </h2>
            </div>
            <p className="font-sans text-sm text-muted-foreground">
              {data.catalog.products} styles ·{" "}
              {data.catalog.variants.toLocaleString()} sizes ·{" "}
              {data.catalog.brands} brands
            </p>
          </div>
        ) : null}

        {loading ? <MatchSkeletons /> : null}

        {!loading && error ? (
          <EmptyState
            icon={<RotateCcw aria-hidden="true" className="size-5" />}
            title="The jeans index did not answer"
            description={error}
            action={
              <button
                type="button"
                onClick={() => requestSilhouette(silhouette === 50 ? 49 : 50)}
                className="h-11 rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground"
              >
                Try again
              </button>
            }
          />
        ) : null}

        {!loading && !error && results.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal aria-hidden="true" className="size-5" />}
            title="No exact pair under that cap"
            description={
              data?.nearestPriceCapCents
                ? `The nearest fit starts at ${money(data.nearestPriceCapCents)}. Raise the cap or move the silhouette toward straight.`
                : "Move the silhouette toward straight to broaden the fit range."
            }
            action={
              <button
                type="button"
                onClick={() =>
                  requestPriceCap(data?.nearestPriceCapCents ?? null)
                }
                className="h-11 rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground"
              >
                Show nearest options
              </button>
            }
          />
        ) : null}

        {!loading && !error && best ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${sort}-${silhouette}-${priceCapCents ?? "all"}`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <MatchHero
                card={best}
                saved={savedIds.has(best.id)}
                onToggle={toggleSaved}
              />
              {rest.length > 0 ? (
                <div className="mt-16">
                  <div className="flex items-end justify-between border-b border-border pb-5">
                    <div>
                      <p className="font-sans text-xs font-bold uppercase text-primary">
                        More translated fits
                      </p>
                      <h2 className="mt-2 font-serif text-4xl">
                        Across the index
                      </h2>
                    </div>
                    <p className="hidden max-w-sm text-right font-sans text-sm text-muted-foreground sm:block">
                      Ranked against {anchorLabel}, then diversified by brand.
                    </p>
                  </div>
                  <motion.div
                    layout
                    className="mt-8 grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {rest.map((card) => (
                        <MatchCard
                          key={card.id}
                          card={card}
                          saved={savedIds.has(card.id)}
                          onToggle={toggleSaved}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </section>
  );
}
