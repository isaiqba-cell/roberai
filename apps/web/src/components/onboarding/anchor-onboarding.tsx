"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Database, Ruler } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { BrandPicker } from "@/components/onboarding/brand-picker";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { createGuestAnchor, upsertGuestAnchor } from "@/lib/guest-anchors";
import {
  clearAnchorDraft,
  readAnchorDraft,
  writeAnchorDraft,
  type AnchorDraft,
} from "@/lib/reference/draft";
import {
  referenceResolutionSchema,
  type ReferenceBrandOption,
  type ReferenceModelOption,
  type ReferenceResolution,
} from "@/lib/reference/types";

const fitNotes = [
  { value: "perfect", label: "Fits perfectly" },
  { value: "tight_thigh", label: "A bit tight in the thigh" },
  { value: "bit_long", label: "A bit long" },
] as const;

const fitNoteCopy = {
  perfect: "Fits perfectly",
  tight_thigh: "A bit tight in the thigh",
  bit_long: "A bit long",
} as const;

type KnownMeasurements = {
  waistCm: string;
  inseamCm: string;
  thighCm: string;
};

type ModelIndex = {
  brandSlug: string;
  models: ReferenceModelOption[];
};

export function AnchorOnboarding({
  brands,
}: {
  brands: ReferenceBrandOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step");
  const requestedNew = searchParams.get("new") === "1";
  const [draft, setDraft] = useState<AnchorDraft | null>(null);
  const [modelIndex, setModelIndex] = useState<ModelIndex | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customModelMode, setCustomModelMode] = useState(false);
  const [customSizeMode, setCustomSizeMode] = useState(false);
  const resetHandled = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const step =
    requestedStep === "confirm" && draft?.resolution
      ? "confirm"
      : requestedStep === "details" && draft
        ? "details"
        : "brand";
  const models = useMemo(
    () =>
      modelIndex && modelIndex.brandSlug === draft?.brandSlug
        ? modelIndex.models
        : [],
    [draft?.brandSlug, modelIndex],
  );
  const modelsLoading = Boolean(
    draft?.brandSlug && modelIndex?.brandSlug !== draft.brandSlug,
  );

  useEffect(() => {
    if (requestedNew && !resetHandled.current) {
      resetHandled.current = true;
      clearAnchorDraft(window.localStorage);
      setDraft(null);
      router.replace("/onboarding?step=brand");
      return;
    }
    setDraft(readAnchorDraft(window.localStorage));
  }, [requestedNew, router]);

  useEffect(() => {
    const brandSlug = draft?.brandSlug;
    if (!brandSlug) return;
    let active = true;
    void fetch(`/api/reference/models?brand=${encodeURIComponent(brandSlug)}`)
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = (await response.json()) as {
          models?: ReferenceModelOption[];
        };
        return payload.models ?? [];
      })
      .then((options) => {
        if (active) setModelIndex({ brandSlug, models: options });
      })
      .catch(() => {
        if (active) setModelIndex({ brandSlug, models: [] });
      });
    return () => {
      active = false;
    };
  }, [draft?.brandSlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const updateDraft = useCallback((next: AnchorDraft) => {
    const stored = writeAnchorDraft(window.localStorage, next);
    setDraft(stored);
  }, []);

  const chooseBrand = useCallback(
    (brand: ReferenceBrandOption) => {
      updateDraft({
        brandSlug: brand.slug,
        brandName: brand.name,
        indexedBrand: brand.indexed,
        modelName: "",
        sizeLabel: "",
      });
      router.push("/onboarding?step=details");
    },
    [router, updateDraft],
  );

  const selectedModel = useMemo(
    () =>
      models.find(
        (model) => model.name.toLowerCase() === draft?.modelName.toLowerCase(),
      ),
    [draft?.modelName, models],
  );
  const sizes = selectedModel?.sizes ?? [];
  const showCustomModel =
    customModelMode ||
    Boolean(
      draft?.modelName && models.length > 0 && selectedModel === undefined,
    );
  const showCustomSize =
    customSizeMode ||
    Boolean(
      draft?.sizeLabel &&
        sizes.length > 0 &&
        !sizes.includes(draft.sizeLabel),
    );

  async function resolvePair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft?.modelName || !draft.sizeLabel) return;
    setResolving(true);
    setError(null);
    try {
      const response = await fetch("/api/reference/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandSlug: draft.brandSlug,
          brandName: draft.brandName,
          modelName: draft.modelName,
          sizeLabel: draft.sizeLabel,
          category: "jeans",
          fitNote: draft.fitNote,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        resolution?: unknown;
      };
      const parsed = referenceResolutionSchema.safeParse(payload.resolution);
      if (!response.ok || !parsed.success) {
        throw new Error(payload.error ?? "We could not read that size chart.");
      }
      updateDraft({ ...draft, resolution: parsed.data });
      router.push("/onboarding?step=confirm");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not read that size chart.",
      );
    } finally {
      setResolving(false);
    }
  }

  function applyKnownMeasurements(
    resolution: ReferenceResolution,
    knownMeasurements: KnownMeasurements,
  ) {
    const measurement = (value: string) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : undefined;
    };
    return {
      ...resolution.spec,
      ...(measurement(knownMeasurements.waistCm)
        ? { waistCm: measurement(knownMeasurements.waistCm) }
        : {}),
      ...(measurement(knownMeasurements.inseamCm)
        ? { inseamCm: measurement(knownMeasurements.inseamCm) }
        : {}),
      ...(measurement(knownMeasurements.thighCm)
        ? { thighCm: measurement(knownMeasurements.thighCm) }
        : {}),
    };
  }

  async function saveAnchor(knownMeasurements: KnownMeasurements) {
    if (!draft?.resolution) return;
    setSaving(true);
    setError(null);
    const spec = applyKnownMeasurements(draft.resolution, knownMeasurements);
    const storedSpec = Object.fromEntries(
      Object.entries(spec).filter(([, value]) => value !== undefined),
    ) as Record<string, string | number | boolean | null>;
    const anchor = createGuestAnchor({
      brandName: draft.resolution.brandName,
      styleName: draft.resolution.modelName,
      taggedSize: draft.resolution.taggedSize,
      category: draft.resolution.category,
      fitNotes: draft.fitNote ? fitNoteCopy[draft.fitNote] : undefined,
      active: true,
      resolvedSpec: storedSpec,
      resolutionSource: draft.resolution.resolutionSource,
      notes: {
        sourceUrl: draft.resolution.sourceUrl,
        sourceConfidence: draft.resolution.sourceConfidence,
        fitNote: draft.fitNote ?? null,
      },
    });

    try {
      if (user) {
        const response = await fetch("/api/anchors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(anchor),
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "The reference pair was not saved.");
        }
      } else {
        upsertGuestAnchor(window.localStorage, anchor);
      }
      clearAnchorDraft(window.localStorage);
      toast({
        title: "Reference pair saved",
        description: `${anchor.brandName} ${anchor.styleName} is now your active fit anchor.`,
        tone: "success",
      });
      router.push(`/matches?anchor=${anchor.clientAnchorId}`, { scroll: true });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The reference pair was not saved.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-shell px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            step === "confirm"
              ? router.push("/onboarding?step=details")
              : router.back()
          }
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <OnboardingProgress
          current={step === "brand" ? 1 : step === "details" ? 2 : 3}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === "brand" ? (
          <motion.section
            key="brand"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-3xl py-14 lg:py-20"
          >
            <p className="font-sans text-xs font-bold uppercase text-primary">
              Step 1 · Brand
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.98] sm:text-6xl">
              Who made your best-fitting jeans?
            </h1>
            <p className="mt-5 max-w-xl font-sans text-base leading-7 text-muted-foreground">
              Choose an indexed brand or type any label on the waistband.
            </p>
            <div className="mt-9">
              <BrandPicker brands={brands} onSelect={chooseBrand} />
            </div>
          </motion.section>
        ) : null}

        {step === "details" && draft ? (
          <motion.section
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid gap-12 py-12 lg:grid-cols-[0.75fr_1.25fr] lg:py-16"
          >
            <div>
              <p className="font-sans text-xs font-bold uppercase text-primary">
                Step 2 · Model and size
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-[0.98]">
                Which {draft.brandName} pair fits best?
              </h1>
              <p className="mt-5 max-w-md font-sans text-base leading-7 text-muted-foreground">
                Use the exact model and tagged size. No measuring tape needed.
              </p>
              <div className="mt-8 flex items-center gap-3 border-y border-border py-5">
                <Database aria-hidden="true" className="size-5 text-primary" />
                <p className="font-sans text-sm text-muted-foreground">
                  {modelsLoading
                    ? "Reading the live index..."
                    : models.length
                      ? `${models.length} ${draft.brandName} fits indexed`
                      : `${draft.brandName} is not indexed yet`}
                </p>
              </div>
            </div>

            <form
              onSubmit={resolvePair}
              className="border-y border-border py-8"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block font-sans text-sm font-bold">
                  Model
                  {modelsLoading ? (
                    <Skeleton className="mt-2 h-12 w-full" />
                  ) : models.length ? (
                    <>
                      <select
                        aria-label="Favorite jeans model"
                        value={
                          showCustomModel ? "__other" : draft.modelName
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          const custom = value === "__other";
                          setCustomModelMode(custom);
                          setCustomSizeMode(false);
                          updateDraft({
                            ...draft,
                            modelName: custom ? "" : value,
                            sizeLabel: "",
                            resolution: undefined,
                          });
                        }}
                        required
                        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="" disabled>
                          Choose a model
                        </option>
                        {models.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name}
                          </option>
                        ))}
                        <option value="__other">My pair is not listed</option>
                      </select>
                      {showCustomModel ? (
                        <input
                          aria-label="Model name on the label"
                          value={draft.modelName}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              modelName: event.target.value,
                              sizeLabel: "",
                              resolution: undefined,
                            })
                          }
                          placeholder="Type the model from the label"
                          autoComplete="off"
                          required
                          className="mt-3 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      ) : null}
                    </>
                  ) : (
                    <input
                      aria-label="Model name on the label"
                      value={draft.modelName}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          modelName: event.target.value,
                          sizeLabel: "",
                          resolution: undefined,
                        })
                      }
                      placeholder="e.g. Regular Fit"
                      autoComplete="off"
                      required
                      className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </label>

                <label className="block font-sans text-sm font-bold">
                  Tagged size
                  {sizes.length ? (
                    <>
                      <select
                        aria-label="Tagged jeans size"
                        value={showCustomSize ? "__other" : draft.sizeLabel}
                        onChange={(event) => {
                          const value = event.target.value;
                          const custom = value === "__other";
                          setCustomSizeMode(custom);
                          updateDraft({
                            ...draft,
                            sizeLabel: custom ? "" : value,
                            resolution: undefined,
                          });
                        }}
                        required
                        className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="" disabled>
                          Choose the tagged size
                        </option>
                        {sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                        <option value="__other">My size is not listed</option>
                      </select>
                      {showCustomSize ? (
                        <input
                          aria-label="Other tagged jeans size"
                          value={draft.sizeLabel}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              sizeLabel: event.target.value,
                              resolution: undefined,
                            })
                          }
                          placeholder="32x32 or W32 L32"
                          autoComplete="off"
                          required
                          className="mt-3 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      ) : null}
                    </>
                  ) : (
                    <input
                      aria-label="Tagged jeans size"
                      value={draft.sizeLabel}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sizeLabel: event.target.value,
                          resolution: undefined,
                        })
                      }
                      placeholder="32x32 or W32 L32"
                      autoComplete="off"
                      required
                      className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </label>
              </div>

              <fieldset className="mt-8">
                <legend className="font-sans text-sm font-bold">
                  How does it fit? <span className="font-normal">Optional</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {fitNotes.map((option) => (
                    <Chip
                      key={option.value}
                      selected={draft.fitNote === option.value}
                      onClick={() =>
                        updateDraft({ ...draft, fitNote: option.value })
                      }
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              {resolving ? (
                <div
                  className="mt-8 grid grid-cols-[88px_1fr] gap-4 border-t border-border pt-6"
                  role="status"
                  aria-label="Resolving garment construction"
                >
                  <Skeleton className="h-28" />
                  <div className="space-y-3 pt-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="mt-6 font-sans text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-8 w-full sm:w-auto"
                disabled={
                  resolving ||
                  !draft.modelName.trim() ||
                  !draft.sizeLabel.trim()
                }
              >
                {resolving ? "Reading construction..." : "Confirm this pair"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </form>
          </motion.section>
        ) : null}

        {step === "confirm" && draft?.resolution ? (
          <ConfirmReference
            key="confirm"
            draft={{ ...draft, resolution: draft.resolution }}
            saving={saving}
            error={error}
            onSave={(measurements) => void saveAnchor(measurements)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ConfirmReference({
  draft,
  saving,
  error,
  onSave,
}: {
  draft: AnchorDraft & { resolution: ReferenceResolution };
  saving: boolean;
  error: string | null;
  onSave: (measurements: KnownMeasurements) => void;
}) {
  const resolution = draft.resolution;
  const spec = resolution.spec;
  const [knownMeasurements, setKnownMeasurements] = useState<KnownMeasurements>(
    () => ({
      waistCm: spec.waistCm?.toString() ?? "",
      inseamCm: spec.inseamCm?.toString() ?? "",
      thighCm: spec.thighCm?.toString() ?? "",
    }),
  );
  const dimensions = [
    spec.waistCm ? `${spec.waistCm} cm waist` : null,
    spec.thighCm ? `${spec.thighCm} cm thigh` : null,
    spec.riseCm ? `${spec.riseCm} cm rise` : null,
    `${spec.cut} leg`,
    `${spec.stretchPct <= 2 ? "low" : spec.stretchPct <= 6 ? "medium" : "high"} stretch`,
  ].filter((value): value is string => Boolean(value));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="py-10 lg:py-14"
    >
      <div className="max-w-3xl">
        <p className="font-sans text-xs font-bold uppercase text-primary">
          Step 3 · Your construction reference
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[0.98] sm:text-6xl">
          This is what we will match against.
        </h1>
        <p className="mt-5 font-sans text-base leading-7 text-muted-foreground">
          Your {resolution.brandName} {resolution.modelName}, size{" "}
          {resolution.taggedSize}
          {dimensions.length ? `: ${dimensions.join(", ")}.` : "."}
        </p>
      </div>

      <div className="mt-10 grid border-y border-border lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[480px] overflow-hidden border-b border-border bg-card lg:border-b-0 lg:border-r">
          <Image
            src="/images/jeans/apc-elisabeth.webp"
            alt="Straight-leg jeans used to visualize garment measurements"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 480px"
            className="object-contain p-12"
          />
          <MeasurementLabel
            className="left-5 top-20"
            label="Waist"
            value={spec.waistCm}
          />
          <MeasurementLabel
            className="right-5 top-44"
            label="Rise"
            value={spec.riseCm}
          />
          <MeasurementLabel
            className="bottom-20 left-5"
            label="Inseam"
            value={spec.inseamCm}
          />
          <MeasurementLabel
            className="bottom-32 right-5"
            label="Thigh"
            value={spec.thighCm}
          />
        </div>

        <div className="flex flex-col justify-center px-0 py-9 lg:px-10">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              {resolution.resolvedFromCatalog ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Ruler aria-hidden="true" className="size-4" />
              )}
            </span>
            <div>
              <p className="font-serif text-2xl">
                {resolution.resolvedFromCatalog
                  ? "Construction resolved"
                  : `We have not indexed ${resolution.brandName} yet`}
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
                {resolution.resolvedFromCatalog
                  ? "The tagged size is linked to a published garment specification."
                  : "We saved a starter reference from the label and queued this model for indexing. Add any known garment measurements below, or continue without them."}
              </p>
            </div>
          </div>

          {!resolution.resolvedFromCatalog ? (
            <fieldset className="mt-8 border-t border-border pt-6">
              <legend className="font-sans text-sm font-bold">
                Known garment measurements in cm{" "}
                <span className="font-normal">Optional</span>
              </legend>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(["waistCm", "inseamCm", "thighCm"] as const).map((field) => (
                  <label
                    key={field}
                    className="font-sans text-xs font-bold capitalize"
                  >
                    {field.replace("Cm", "")}
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="0.1"
                      value={knownMeasurements[field]}
                      onChange={(event) =>
                        setKnownMeasurements({
                          ...knownMeasurements,
                          [field]: event.target.value,
                        })
                      }
                      className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 font-sans text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {resolution.sourceUrl ? (
            <p className="mt-7 font-sans text-xs leading-5 text-muted-foreground">
              Source: published size guide from{" "}
              {new URL(resolution.sourceUrl).hostname.replace("www.", "")}
            </p>
          ) : null}
          {resolution.ingestionQueued ? (
            <p className="mt-3 font-sans text-xs leading-5 text-muted-foreground">
              Indexing request queued for review.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-5 font-sans text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="mt-8 w-full"
            disabled={saving}
            onClick={() => onSave(knownMeasurements)}
          >
            {saving ? "Saving fit memory..." : "Find my matches"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function MeasurementLabel({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number | undefined;
}) {
  if (value === undefined) return null;
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.2 }}
      className={`absolute rounded-md border border-border bg-background/95 px-3 py-2 font-sans text-xs shadow-sm ${className}`}
    >
      <span className="font-bold">{label}</span> {value} cm
    </motion.span>
  );
}
