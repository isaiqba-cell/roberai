"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { MatchesExperience } from "@/components/matches/matches-experience";
import {
  readGuestAnchors,
  writeGuestAnchors,
  type GuestAnchor,
} from "@/lib/guest-anchors";
import { garmentSpecSchema, normalizeGarmentSpec } from "@/lib/reference/types";
import type { Json } from "@/lib/supabase/database.types";

export type AccountAnchor = {
  id: string;
  client_anchor_id: string;
  brand_name: string | null;
  style_name: string | null;
  tagged_size: string | null;
  category: "jeans" | "chinos" | "pants";
  active: boolean;
  resolved_spec: Json | null;
  resolution_source: "catalog" | "self_reported" | "seeded" | "scraped" | null;
  tight_or_loose_notes: string | null;
};

type DisplayAnchor = {
  id: string;
  clientId: string;
  brandName: string;
  styleName: string;
  taggedSize: string;
  active: boolean;
  resolvedSpec: Json | Record<string, unknown> | null;
  resolutionSource: AccountAnchor["resolution_source"];
  fitNotes: string | null;
};

function accountDisplayAnchor(anchor: AccountAnchor): DisplayAnchor {
  return {
    id: anchor.id,
    clientId: anchor.client_anchor_id,
    brandName: anchor.brand_name ?? "Reference brand",
    styleName: anchor.style_name ?? "Reference pair",
    taggedSize: anchor.tagged_size ?? "Size saved",
    active: anchor.active,
    resolvedSpec: anchor.resolved_spec,
    resolutionSource: anchor.resolution_source,
    fitNotes: anchor.tight_or_loose_notes,
  };
}

function guestDisplayAnchor(anchor: GuestAnchor): DisplayAnchor {
  return {
    id: anchor.clientAnchorId,
    clientId: anchor.clientAnchorId,
    brandName: anchor.brandName,
    styleName: anchor.styleName,
    taggedSize: anchor.taggedSize,
    active: anchor.active,
    resolvedSpec: anchor.resolvedSpec ?? null,
    resolutionSource: anchor.resolutionSource ?? null,
    fitNotes: anchor.fitNotes ?? null,
  };
}

export function AnchorMemory({
  accountAnchors,
  authenticated,
}: {
  accountAnchors: AccountAnchor[];
  authenticated: boolean;
}) {
  const accountDisplayAnchors = useMemo(
    () => accountAnchors.map(accountDisplayAnchor),
    [accountAnchors],
  );
  const [guestAnchors, setGuestAnchors] = useState<DisplayAnchor[]>([]);
  const [guestHydrated, setGuestHydrated] = useState(false);
  const [accountActiveId, setAccountActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authenticated) return;
    const frame = window.requestAnimationFrame(() => {
      setGuestAnchors(
        readGuestAnchors(window.localStorage).map(guestDisplayAnchor),
      );
      setGuestHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [authenticated]);

  const anchors = useMemo(() => {
    if (!authenticated) return guestAnchors;
    if (!accountActiveId) return accountDisplayAnchors;
    return accountDisplayAnchors.map((anchor) => ({
      ...anchor,
      active: anchor.id === accountActiveId,
    }));
  }, [accountActiveId, accountDisplayAnchors, authenticated, guestAnchors]);
  const hydrated = authenticated || guestHydrated;

  const activeAnchor = useMemo(
    () => anchors.find((anchor) => anchor.active) ?? anchors[0] ?? null,
    [anchors],
  );
  const parsedSpec = garmentSpecSchema.safeParse(activeAnchor?.resolvedSpec);

  async function switchAnchor(id: string) {
    if (!id || id === activeAnchor?.id) return;
    setSwitching(true);
    if (authenticated) {
      const response = await fetch("/api/anchors/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchorId: id }),
      });
      if (!response.ok) {
        toast({
          title: "Reference pair unchanged",
          description: "We could not switch the active pair. Try again.",
        });
        setSwitching(false);
        return;
      }
      setAccountActiveId(id);
    } else {
      const next = readGuestAnchors(window.localStorage).map((anchor) => ({
        ...anchor,
        active: anchor.clientAnchorId === id,
      }));
      writeGuestAnchors(window.localStorage, next);
      setGuestAnchors(next.map(guestDisplayAnchor));
    }
    setSwitching(false);
  }

  if (!hydrated) {
    return (
      <div className="mt-12 border-y border-border py-10" role="status">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-16 w-3/4" />
        <Skeleton className="mt-8 h-12 w-full" />
        <span className="sr-only">Loading fit memory</span>
      </div>
    );
  }

  if (!activeAnchor) {
    return (
      <EmptyState
        className="mt-12"
        icon={<Ruler aria-hidden="true" className="size-5" />}
        title="Add a reference pair first"
        description="Choose the jeans you already trust. Rober will resolve their construction and remember the pair on this device."
        action={
          <Button asChild>
            <Link href="/onboarding?step=brand">Add reference pair</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mt-10">
      <section className="sticky top-[73px] z-20 border-y border-border bg-background/95 py-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="font-sans text-xs font-bold uppercase text-primary">
              Matched to your reference
            </p>
            <p className="mt-1 max-w-3xl font-serif text-2xl leading-tight">
              {activeAnchor.brandName} {activeAnchor.styleName} ·{" "}
              {activeAnchor.taggedSize}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {anchors.length > 1 ? (
              <label className="font-sans text-xs font-bold text-muted-foreground">
                Active pair
                <select
                  value={activeAnchor.id}
                  disabled={switching}
                  onChange={(event) => void switchAnchor(event.target.value)}
                  className="ml-2 h-10 max-w-52 rounded-md border border-input bg-background px-3 font-sans text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {anchors.map((anchor) => (
                    <option key={anchor.id} value={anchor.id}>
                      {anchor.brandName} {anchor.styleName} ·{" "}
                      {anchor.taggedSize}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/onboarding?step=brand&new=1">
                <Plus aria-hidden="true" />
                Add another pair
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid border-b border-border py-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
        <div>
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Check aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-6 font-serif text-4xl">Your reference is ready.</h2>
          <p className="mt-4 max-w-md font-sans text-base leading-7 text-muted-foreground">
            Every recommendation will be scored against this garment, not a
            generic body-size average.
          </p>
          {activeAnchor.fitNotes ? (
            <p className="mt-5 font-sans text-sm text-muted-foreground">
              Fit note: {activeAnchor.fitNotes}
            </p>
          ) : null}
        </div>

        <dl className="mt-9 grid grid-cols-2 border-t border-border lg:mt-0 lg:grid-cols-3">
          {[
            [
              "Waist",
              parsedSpec.success ? parsedSpec.data.waistCm : undefined,
              "cm",
            ],
            [
              "Inseam",
              parsedSpec.success ? parsedSpec.data.inseamCm : undefined,
              "cm",
            ],
            [
              "Thigh",
              parsedSpec.success ? parsedSpec.data.thighCm : undefined,
              "cm",
            ],
            [
              "Rise",
              parsedSpec.success ? parsedSpec.data.riseCm : undefined,
              "cm",
            ],
            ["Leg", parsedSpec.success ? parsedSpec.data.cut : undefined, ""],
            [
              "Stretch",
              parsedSpec.success ? parsedSpec.data.stretchPct : undefined,
              "%",
            ],
          ].map(([label, value, unit]) => (
            <div
              key={label}
              className="min-h-28 border-b border-r border-border p-5"
            >
              <dt className="font-sans text-xs font-bold uppercase text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-3 font-serif text-2xl capitalize">
                {value === undefined ? "Pending" : `${value}${unit}`}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {parsedSpec.success ? (
        <MatchesExperience
          key={activeAnchor.id}
          anchor={normalizeGarmentSpec(parsedSpec.data)}
          anchorLabel={`${activeAnchor.brandName} ${activeAnchor.styleName} ${activeAnchor.taggedSize}`}
        />
      ) : (
        <EmptyState
          className="mt-10"
          icon={<Ruler aria-hidden="true" className="size-5" />}
          title="This reference needs measurements"
          description="Re-open the reference flow so Rober can resolve the garment measurements before matching."
          action={
            <Button asChild>
              <Link href="/onboarding?step=brand">Resolve reference pair</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
