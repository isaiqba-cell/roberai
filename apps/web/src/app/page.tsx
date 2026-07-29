import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Database,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AnchorStart } from "@/components/onboarding/anchor-start";
import { Button } from "@/components/ui/button";
import { getCatalogIndexStatus } from "@/lib/catalog/server";
import { getPublicCatalogBrands } from "@/lib/catalog/public-brand";
import { getReferenceBrands } from "@/lib/reference/server";

export const metadata: Metadata = {
  title: "Know your size in every brand",
  description:
    "Start with jeans that already fit. Rober translates that garment across brands and tells you the size to buy.",
  openGraph: {
    title: "Rober | Know your size in every brand",
    description:
      "Fit translation for denim, grounded in the pair you already trust.",
    type: "website",
    images: [
      {
        url: "/images/jeans/apc-elisabeth.webp",
        width: 1200,
        height: 1200,
        alt: "A pair of indigo straight-leg jeans",
      },
    ],
  },
};

const processSteps = [
  {
    number: "01",
    title: "Name your pair",
    copy: "Choose the brand, model, and tagged size of jeans you know fit.",
    image: "/images/jeans/apc-elisabeth.webp",
    imageAlt: "Dark indigo straight-leg jeans used as a fit reference",
    visual: "Levi's · 32x32",
  },
  {
    number: "02",
    title: "Rober translates it",
    copy: "Construction and size charts become one comparable garment profile.",
    image: "/images/jeans/agolde-straight.jpg",
    imageAlt: "Mid-wash jeans translated into a comparable garment profile",
    visual: "Waist · rise · thigh · inseam",
  },
  {
    number: "03",
    title: "Buy the right size",
    copy: "See the exact size, fit confidence, price, and reason for every match.",
    image: "/images/jeans/light-packshot.webp",
    imageAlt: "Light-wash jeans recommended as a high-confidence fit",
    visual: "96% fit · Buy 31x32",
  },
];

export default async function HomePage() {
  const [anchorBrands, publicBrands, status] = await Promise.all([
    getReferenceBrands(),
    getPublicCatalogBrands(),
    getCatalogIndexStatus(),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-shell px-5 lg:px-8">
        <section className="grid border-b border-border lg:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
          <Reveal className="flex flex-col justify-center py-12 lg:min-h-[38rem] lg:border-r lg:border-border lg:py-16 lg:pr-14">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <ScanSearch aria-hidden="true" className="size-4" />
              Fit translation for denim
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.96] sm:text-6xl lg:text-7xl">
              Know your size in every brand.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Start with jeans that already fit. Rober compares the garment,
              then tells you which size to buy across brands and price points.
            </p>
            <div className="mt-8 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
                Which jeans fit you best?
              </p>
              <AnchorStart brands={anchorBrands} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-fit-high" />
                No body scan
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-fit-high" />
                No measuring tape
              </span>
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-fit-high" />
                Guest mode works
              </span>
            </div>
          </Reveal>

          <RevealGroup className="grid min-h-[31rem] grid-cols-[1.2fr_0.8fr] gap-px bg-border lg:min-h-[38rem] lg:pl-px">
            <RevealItem className="relative overflow-hidden bg-card">
              <Image
                src="/images/jeans/apc-elisabeth.webp"
                alt="Dark indigo straight-leg jeans"
                fill
                priority
                sizes="(max-width: 1024px) 60vw, 430px"
                className="object-contain px-7 py-10"
              />
              <span className="absolute left-5 top-5 bg-primary px-3 py-2 text-xs font-bold uppercase text-primary-foreground">
                Your reference
              </span>
            </RevealItem>
            <div className="grid grid-rows-2 gap-px bg-border">
              {(
                [
                [
                  "/images/jeans/agolde-straight.jpg",
                  "Mid-wash high-rise straight jeans",
                  "96% fit",
                ],
                [
                  "/images/jeans/light-packshot.webp",
                  "Light-wash relaxed straight jeans",
                  "Buy 31x32",
                ],
                ] as const
              ).map(([src, alt, label]) => (
                <div key={src} className="relative overflow-hidden bg-card">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 40vw, 260px"
                    className="object-contain px-5 py-7"
                  />
                  <span className="absolute bottom-4 left-4 border border-border bg-background px-3 py-2 text-xs font-bold">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </RevealGroup>
        </section>

        <RevealGroup className="grid grid-cols-2 border-b border-border py-7 sm:grid-cols-4">
          {[
            [status.brands.toString(), "indexed brands"],
            [status.products.toLocaleString(), "denim styles"],
            [status.variants.toLocaleString(), "fit-ready sizes"],
            [status.chartSources.toString(), "chart sources"],
          ].map(([value, label]) => (
            <RevealItem
              key={label}
              className="border-l border-border px-4 first:border-l-0 first:pl-0 sm:px-6 sm:first:pl-0"
            >
              <p className="font-serif text-3xl font-semibold tabular-nums sm:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">
                {label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        <section className="py-16 lg:py-20" aria-labelledby="how-it-works">
          <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-7">
            <div>
              <p className="text-xs font-bold uppercase text-primary">How it works</p>
              <h2
                id="how-it-works"
                className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl"
              >
                One known pair in. The right size out.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Rober matches garments to garments, not your body to a generic
              brand average.
            </p>
          </Reveal>

          <RevealGroup className="grid md:grid-cols-3">
            {processSteps.map((step) => (
              <RevealItem
                key={step.number}
                className="border-b border-border py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-card">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-contain px-8 py-6"
                  />
                  <span className="absolute bottom-3 left-3 bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                    {step.visual}
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-serif text-3xl text-primary">
                    {step.number}
                  </span>
                  <Check aria-hidden="true" className="size-4 text-fit-high" />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.copy}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      </div>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-shell gap-8 px-5 py-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-bold uppercase">Illustrative retailer scenario</p>
            <p className="mt-3 font-serif text-6xl font-semibold">10%</p>
          </div>
          <div>
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              Fewer size-related returns would materially change denim margins.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 opacity-85">
              Illustrative model only, not measured Rober performance. The demo
              shows the product mechanism: a clearer size decision before the
              shopper leaves for the retailer.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-shell px-5 lg:px-8">
        <section className="py-16 lg:py-20" aria-labelledby="brand-index">
          <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <Database aria-hidden="true" className="size-4" />
                Live denim index
              </div>
              <h2 id="brand-index" className="mt-3 font-serif text-4xl sm:text-5xl">
                Explore fit by brand.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/brands">
                View every brand
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
          <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-4">
            {publicBrands.slice(0, 8).map((brand) => (
              <RevealItem key={brand.slug} className="border-b border-border sm:border-r">
                <Link
                  href={`/brands/${brand.slug}`}
                  className="group flex min-h-36 flex-col justify-between px-5 py-6 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="font-serif text-2xl font-semibold">
                    {brand.name}
                  </span>
                  <span className="flex items-center justify-between text-sm text-muted-foreground">
                    {brand.modelCount} indexed fits
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-5 text-fit-high" />
            <p>
              Sizing evidence is versioned and linked to its source. Rober does
              not claim retailer partnerships or live inventory.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
