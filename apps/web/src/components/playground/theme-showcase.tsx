"use client";

import { useState } from "react";
import { ArrowUpRight, Heart, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toast";

const fitLabels = ["Skinny", "Slim", "Straight", "Relaxed", "Baggy"];

function fitLabel(value: number) {
  return fitLabels[Math.min(4, Math.floor(value / 21))] ?? "Straight";
}

export function ThemeShowcase({ theme }: { theme: "light" | "dark" }) {
  const [fit, setFit] = useState(50);
  const [selectedChip, setSelectedChip] = useState("Straight");
  const { toast } = useToast();

  return (
    <section
      data-theme={theme}
      aria-labelledby={`${theme}-showcase-title`}
      className="overflow-hidden border border-border bg-background text-foreground"
    >
      <header className="flex items-end justify-between gap-6 border-b border-border px-6 py-7">
        <div>
          <p className="font-sans text-xs font-bold uppercase text-primary">
            {theme} theme
          </p>
          <h2
            id={`${theme}-showcase-title`}
            className="mt-2 font-serif text-4xl leading-none"
          >
            Rober essentials
          </h2>
        </div>
        <span className="hidden font-sans text-xs text-muted-foreground sm:block">
          12 px cards · 24 px sheets
        </span>
      </header>

      <div className="grid border-b border-border lg:grid-cols-2">
        <div className="space-y-5 border-b border-border p-6 lg:border-b-0 lg:border-r">
          <h3 className="font-sans text-xs font-bold uppercase text-muted-foreground">
            Commands
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button>Find matches</Button>
            <Button variant="secondary">Save pair</Button>
            <Button variant="outline">Compare</Button>
            <Button variant="ghost">Clear</Button>
            <Button
              aria-label="Save favorite pair"
              title="Save favorite pair"
              variant="outline"
              size="icon"
            >
              <Heart aria-hidden="true" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Fit filters">
            {["Straight", "Relaxed", "Stretch"].map((chip) => (
              <Chip
                key={chip}
                selected={selectedChip === chip}
                onClick={() => setSelectedChip(chip)}
              >
                {chip}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <h3 className="font-sans text-xs font-bold uppercase text-muted-foreground">
            Fit control
          </h3>
          <Slider
            label="Silhouette"
            value={[fit]}
            onValueChange={([value]) => setFit(value ?? 50)}
            valueLabel={fitLabel(fit)}
          />
          <div className="flex flex-wrap gap-2">
            <ConfidenceBadge confidence={92} />
            <ConfidenceBadge confidence={72} />
            <ConfidenceBadge confidence={48} />
          </div>
        </div>
      </div>

      <div className="grid border-b border-border lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
          <h3 className="mb-5 font-sans text-xs font-bold uppercase text-muted-foreground">
            Card
          </h3>
          <Card>
            <CardHeader>
              <p className="font-sans text-xs font-bold uppercase text-primary">
                Your reference
              </p>
              <CardTitle>Levi&apos;s 501 Original</CardTitle>
              <CardDescription>
                Size 32x32 · regular straight · low stretch
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-serif text-3xl">32x32</span>
              <ConfidenceBadge confidence={96} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View fit details
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-5 p-6">
          <h3 className="font-sans text-xs font-bold uppercase text-muted-foreground">
            Overlays and feedback
          </h3>
          <div className="flex flex-wrap gap-3">
            <Dialog
              theme={theme}
              title="Fit detail"
              description="This candidate keeps the same rise and adds 1.2 cm through the thigh."
              trigger={<Button variant="outline">Open dialog</Button>}
            >
              <div className="flex items-center justify-between gap-4 border-y border-border py-5">
                <span className="font-sans text-sm text-muted-foreground">
                  Recommended size
                </span>
                <span className="font-serif text-3xl">33x32</span>
              </div>
            </Dialog>
            <Sheet
              theme={theme}
              title="Refine matches"
              description="Tune the silhouette without changing the reference pair."
              trigger={<Button variant="outline">Open sheet</Button>}
            >
              <Slider
                label="Room through thigh"
                defaultValue={[62]}
                valueLabel="Roomier"
              />
            </Sheet>
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  title: "Reference pair saved",
                  description: "Your fit memory is ready for matching.",
                  tone: "success",
                  theme,
                })
              }
            >
              Show toast
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
          <h3 className="mb-5 font-sans text-xs font-bold uppercase text-muted-foreground">
            Loading state
          </h3>
          <ProductCardSkeleton />
        </div>
        <div className="p-6">
          <h3 className="font-sans text-xs font-bold uppercase text-muted-foreground">
            Empty state
          </h3>
          <EmptyState
            icon={<Ruler aria-hidden="true" className="size-5" />}
            title="No relaxed pairs under $80"
            description="The closest fit is $86. Raise the cap once to bring it into view."
            action={<Button size="sm">Show the $86 pair</Button>}
          />
        </div>
      </div>
    </section>
  );
}
