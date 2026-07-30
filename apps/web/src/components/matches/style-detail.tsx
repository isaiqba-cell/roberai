"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
  Heart,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { GarmentSpec } from "@rober/fit-engine";

import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { readGuestAnchors } from "@/lib/guest-anchors";
import type {
  MatchApiError,
  StyleDetailResponse,
  StyleDimensionDelta,
  StyleSizeScore,
} from "@/lib/matches/types";
import { garmentSpecSchema, normalizeGarmentSpec } from "@/lib/reference/types";
import { readGuestSavedItems, toggleGuestSavedItem } from "@/lib/saved-items";
import type { Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function accountGarmentSpec(value: Json | null) {
  const parsed = garmentSpecSchema.safeParse(value);
  return parsed.success ? normalizeGarmentSpec(parsed.data) : null;
}

function deltaLabel(delta: number) {
  if (Math.abs(delta) < 0.5) return "Same";
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} cm`;
}

const scoreKeys: Record<StyleDimensionDelta["key"], string> = {
  waistCm: "waist",
  inseamCm: "inseam",
  thighCm: "thigh",
  riseCm: "rise",
  legOpeningCm: "legOpening",
};

function dimensionsFor(
  anchor: GarmentSpec,
  size: StyleSizeScore,
  baseline: StyleDimensionDelta[],
) {
  return baseline.flatMap((dimension) => {
    const anchorValue = anchor[dimension.key];
    const candidateValue = size.spec[dimension.key];
    if (anchorValue === undefined || candidateValue === undefined) return [];
    return [
      {
        ...dimension,
        anchorValue,
        candidateValue,
        delta: Math.round((candidateValue - anchorValue) * 10) / 10,
        score: size.dimensionScores[scoreKeys[dimension.key]] ?? null,
      },
    ];
  });
}

function withSelectedSize(urlValue: string, size: string) {
  const url = new URL(urlValue);
  url.searchParams.set("rober_size", size);
  return url.toString();
}

function DetailBody({
  productId,
  accountAnchor,
  authenticated,
  onDismiss,
}: {
  productId: string;
  accountAnchor: Json | null;
  authenticated: boolean;
  onDismiss?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [anchor, setAnchor] = useState<GarmentSpec | null>(() =>
    accountGarmentSpec(accountAnchor),
  );
  const [anchorHydrated, setAnchorHydrated] = useState(
    authenticated || Boolean(accountAnchor),
  );
  const [data, setData] = useState<StyleDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authenticated) {
      const controller = new AbortController();
      void fetch("/api/saved", { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return;
          const payload = (await response.json()) as {
            items: Array<{ productId: string }>;
          };
          setSaved(payload.items.some((item) => item.productId === productId));
        })
        .catch(() => undefined);
      return () => controller.abort();
    }
    const frame = window.requestAnimationFrame(() => {
      const active =
        readGuestAnchors(window.localStorage).find((item) => item.active) ??
        readGuestAnchors(window.localStorage)[0];
      const parsed = garmentSpecSchema.safeParse(active?.resolvedSpec);
      setAnchor(parsed.success ? normalizeGarmentSpec(parsed.data) : null);
      setAnchorHydrated(true);
      setSaved(
        readGuestSavedItems(window.localStorage).some(
          (item) => item.productId === productId,
        ),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [authenticated, productId]);

  useEffect(() => {
    if (!anchor) return;
    const controller = new AbortController();
    void fetch(`/api/styles/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anchor }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          StyleDetailResponse | MatchApiError;
        if (!response.ok || "error" in payload) {
          throw new Error("error" in payload ? payload.error : "Style failed");
        }
        setData(payload);
        setSelectedVariantId(payload.recommended.variantId);
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
            : "The fit detail could not be loaded.",
        );
      });
    return () => controller.abort();
  }, [anchor, productId]);

  const selectedSize = useMemo(
    () =>
      data?.sizes.find((size) => size.variantId === selectedVariantId) ??
      data?.sizes[0] ??
      null,
    [data, selectedVariantId],
  );
  const displayDimensions = useMemo(
    () =>
      anchor && selectedSize && data
        ? dimensionsFor(anchor, selectedSize, data.dimensions)
        : [],
    [anchor, data, selectedSize],
  );

  function toggleSaved() {
    if (!data || !selectedSize) return;
    if (authenticated) {
      const nextSaved = !saved;
      setSaved(nextSaved);
      void fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.product.id,
          variantId: selectedSize.variantId,
          saved: nextSaved,
        }),
      }).then((response) => {
        if (response.ok) {
          trackAnalyticsEvent({
            event: "save_toggled",
            properties: {
              productId: data.product.id,
              saved: nextSaved,
              surface: "style_detail",
              authenticated: true,
            },
          });
          return;
        }
        setSaved(!nextSaved);
        toast({
          title: "Saved list unchanged",
          description: "The account update did not finish. Try again.",
        });
      });
      return;
    }
    const next = toggleGuestSavedItem(window.localStorage, {
      productId: data.product.id,
      variantId: selectedSize.variantId,
      brandName: data.product.brandName,
      title: data.product.title,
      imageUrl: data.product.imageUrl,
      priceCents: selectedSize.priceCents,
      recommendedSize: selectedSize.sizeLabel,
      confidence: selectedSize.confidence,
      reason: data.recommended.reason,
      savedAt: new Date().toISOString(),
    });
    const isSaved = next.some((item) => item.productId === data.product.id);
    setSaved(isSaved);
    trackAnalyticsEvent({
      event: "save_toggled",
      properties: {
        productId: data.product.id,
        saved: isSaved,
        surface: "style_detail",
        authenticated: false,
      },
    });
    toast({
      title: isSaved ? "Saved with fit memory" : "Removed from saved",
      description: isSaved
        ? `Rober saved size ${selectedSize.sizeLabel} and its fit score.`
        : `${data.product.title} was removed.`,
    });
  }

  function logOutbound() {
    if (!data || !selectedSize) return;
    void fetch("/api/events/outbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: data.product.id,
        variantId: selectedSize.variantId,
        retailerDomain: data.retailer.domain,
      }),
      keepalive: true,
    });
  }

  if (!anchorHydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />
        <span className="sr-only">Loading reference pair</span>
      </div>
    );
  }

  if (!anchor) {
    return (
      <EmptyState
        className="m-6"
        icon={<ArrowLeft aria-hidden="true" className="size-5" />}
        title="Add your reference pair first"
        description="Fit detail is calculated against jeans you already know fit."
        action={
          <Link
            href="/onboarding?step=brand"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground"
          >
            Add reference pair
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        className="m-6"
        icon={<X aria-hidden="true" className="size-5" />}
        title="Fit detail unavailable"
        description={error}
        action={
          <Link
            href="/matches"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-sans text-sm font-bold text-primary-foreground"
          >
            Back to matches
          </Link>
        }
      />
    );
  }

  if (!data || !selectedSize) {
    return (
      <div className="space-y-6 p-6 lg:p-9" role="status">
        <div className="aspect-[4/3] animate-pulse rounded-md bg-muted" />
        <div className="h-12 w-4/5 animate-pulse bg-muted" />
        <div className="h-28 animate-pulse rounded-md bg-muted" />
        <span className="sr-only">Calculating style fit</span>
      </div>
    );
  }

  const outboundUrl = withSelectedSize(
    data.retailer.outboundUrl,
    selectedSize.sizeLabel,
  );
  const checkedDate = data.provenance.checkedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(data.provenance.checkedAt))
    : "recently";

  return (
    <div className="pb-12">
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur lg:px-8">
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close fit detail"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 font-sans text-sm font-bold hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Matches
          </Link>
        )}
        <p className="font-sans text-xs font-bold uppercase text-primary">
          Fit detail
        </p>
        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? "Remove from saved" : "Save this style"}
          aria-pressed={saved}
          className="inline-flex size-10 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary"
        >
          <Heart
            aria-hidden="true"
            className="size-5"
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
        className="relative h-[21rem] overflow-hidden border-b border-border bg-muted"
      >
        <Image
          src={data.product.imageUrl}
          alt={`${data.product.brandName} ${data.product.title}`}
          fill
          priority
          sizes="(min-width: 768px) 42rem, 100vw"
          className="object-contain p-8"
        />
      </motion.div>

      <div className="px-5 pt-8 lg:px-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-sans text-xs font-bold uppercase text-primary">
              {data.product.brandName}
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-none lg:text-5xl">
              {data.product.title}
            </h1>
          </div>
          <p className="shrink-0 font-serif text-2xl">
            {money(selectedSize.priceCents, data.product.currency)}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ConfidenceBadge confidence={selectedSize.confidence} />
          <p className="font-serif text-lg text-muted-foreground">
            {data.recommended.reason}
          </p>
        </div>

        <section
          className="mt-9 border-t border-border pt-7"
          aria-labelledby="size-heading"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-sans text-xs font-bold uppercase text-muted-foreground">
                Recommended size
              </p>
              <h2 id="size-heading" className="mt-1 font-serif text-3xl">
                {selectedSize.sizeLabel}
              </h2>
            </div>
            <p className="font-sans text-sm text-muted-foreground">
              {selectedSize.confidence}% fit
            </p>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {data.sizes.slice(0, 12).map((size) => (
              <button
                key={size.variantId}
                type="button"
                onClick={() => setSelectedVariantId(size.variantId)}
                aria-pressed={size.variantId === selectedSize.variantId}
                className={cn(
                  "min-w-[6.2rem] shrink-0 rounded-md border px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  size.variantId === selectedSize.variantId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                <span className="block font-sans text-sm font-bold">
                  {size.sizeLabel}
                </span>
                <span className="mt-1 block font-sans text-xs opacity-75">
                  {size.confidence}% fit
                </span>
              </button>
            ))}
          </div>
        </section>

        <a
          href={outboundUrl}
          target="_blank"
          rel="noopener nofollow sponsored"
          onClick={logOutbound}
          className="mt-7 flex min-h-14 w-full items-center justify-between rounded-md bg-primary px-5 font-sans text-base font-bold text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Shop size {selectedSize.sizeLabel} at {data.retailer.domain}
          <ArrowUpRight aria-hidden="true" className="size-5" />
        </a>
        <p className="mt-3 flex items-start gap-2 font-sans text-xs leading-5 text-muted-foreground">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span>
            {data.provenance.label}, checked {checkedDate}.
            {data.provenance.sourceUrl ? (
              <a
                href={data.provenance.sourceUrl}
                target="_blank"
                rel="noopener nofollow"
                className="ml-1 text-primary underline underline-offset-2"
              >
                View source{" "}
                <ExternalLink aria-hidden="true" className="inline size-3" />
              </a>
            ) : null}
          </span>
        </p>

        <section
          className="mt-10 border-t border-border pt-8"
          aria-labelledby="delta-heading"
        >
          <p className="font-sans text-xs font-bold uppercase text-primary">
            Against your pair
          </p>
          <h2 id="delta-heading" className="mt-2 font-serif text-3xl">
            Measurement by measurement
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {displayDimensions.map((dimension, index) => {
              const width = Math.min(
                48,
                Math.max(4, Math.abs(dimension.delta) * 7),
              );
              return (
                <div
                  key={dimension.key}
                  className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-4 py-5"
                >
                  <div>
                    <p className="font-sans text-sm font-bold">
                      {dimension.label}
                    </p>
                    <p className="mt-1 font-sans text-xs text-muted-foreground">
                      {Math.round(dimension.score ?? 0)}% close
                    </p>
                  </div>
                  <div className="relative h-2 bg-muted" aria-hidden="true">
                    <span className="absolute left-1/2 top-[-4px] h-4 w-px bg-foreground/45" />
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.35,
                        delay: reduceMotion ? 0 : index * 0.04,
                      }}
                      className={cn(
                        "absolute top-0 h-2 bg-primary",
                        dimension.delta < 0 ? "right-1/2" : "left-1/2",
                      )}
                    />
                  </div>
                  <p className="text-right font-serif text-lg">
                    {deltaLabel(dimension.delta)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-md border border-border bg-secondary p-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-5 font-serif text-3xl">Construction notes</h2>
          <p className="mt-3 font-serif text-lg leading-8 text-muted-foreground">
            {data.product.material}. {selectedSize.spec.stretchPct}% stretch
            with a {selectedSize.spec.cut} silhouette. Rober scores the garment
            itself, including thigh, rise, inseam, and opening.
          </p>
        </section>

        <button
          type="button"
          onClick={toggleSaved}
          className="mt-8 w-full border-t border-border py-6 text-left font-serif text-lg hover:text-primary"
        >
          Did you order it? Save this fit and Rober will remember size{" "}
          {selectedSize.sizeLabel}.
        </button>
      </div>
    </div>
  );
}

export function StyleDetail({
  productId,
  overlay,
  authenticated,
  accountAnchor,
}: {
  productId: string;
  overlay: boolean;
  authenticated: boolean;
  accountAnchor: Json | null;
}) {
  const router = useRouter();

  if (!overlay) {
    return (
      <div className="mx-auto max-w-3xl border-x border-border bg-background">
        <DetailBody
          productId={productId}
          authenticated={authenticated}
          accountAnchor={accountAnchor}
        />
      </div>
    );
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && router.back()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/50 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-[51] w-full overflow-y-auto border-l border-border bg-background shadow-2xl outline-none data-[state=open]:animate-in sm:max-w-2xl"
        >
          <Dialog.Title className="sr-only">Style fit detail</Dialog.Title>
          <DetailBody
            productId={productId}
            authenticated={authenticated}
            accountAnchor={accountAnchor}
            onDismiss={() => router.back()}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
