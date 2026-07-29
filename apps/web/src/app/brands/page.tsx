import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getPublicCatalogBrands } from "@/lib/catalog/public-brand";
import { getCatalogIndexStatus } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Indexed jeans brands",
  description:
    "Browse the denim brands and model-level size charts in Rober's fit translation index.",
};

export default async function BrandsPage() {
  const [brands, status] = await Promise.all([
    getPublicCatalogBrands(),
    getCatalogIndexStatus(),
  ]);

  return (
    <div className="mx-auto max-w-shell px-5 py-12 lg:px-8 lg:py-16">
      <Reveal className="grid gap-10 border-b border-border pb-10 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
            <Database aria-hidden="true" className="size-4" />
            Public fit index
          </div>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.98] sm:text-6xl">
            The jeans Rober can translate today.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Browse model-level fit references, available tagged sizes, and the
            denim styles calibrated against each chart.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-card">
          <Image
            src="/images/jeans/dark-slide.webp"
            alt="Dark-wash straight-leg jeans"
            fill
            priority
            sizes="352px"
            className="object-contain px-8 py-6"
          />
        </div>
      </Reveal>

      <dl className="grid grid-cols-3 border-b border-border py-7">
        {[
          [status.brands.toString(), "brands"],
          [status.products.toLocaleString(), "styles"],
          [status.variants.toLocaleString(), "size options"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="border-l border-border px-4 first:border-l-0 first:pl-0 sm:px-8"
          >
            <dt className="text-xs font-bold uppercase text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 font-serif text-3xl font-semibold tabular-nums sm:text-4xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <RevealGroup className="grid py-8 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <RevealItem key={brand.slug} className="border-b border-border sm:border-r">
            <Link
              href={`/brands/${brand.slug}`}
              className="group flex min-h-48 flex-col justify-between px-5 py-7 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7"
            >
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  Indexed denim
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold">
                  {brand.name}
                </h2>
              </div>
              <div className="flex items-center justify-between gap-5 text-sm text-muted-foreground">
                <span>
                  {brand.modelCount} model{brand.modelCount === 1 ? "" : "s"}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      <p className="border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
        Indexed sizing is evidence for fit translation, not a claim of live
        stock or a retailer partnership.
      </p>
    </div>
  );
}
