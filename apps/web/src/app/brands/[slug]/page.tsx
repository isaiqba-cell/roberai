import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Database, ShieldCheck } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BrandAnchorButton } from "@/components/onboarding/brand-anchor-button";
import { Button } from "@/components/ui/button";
import { getPublicBrand } from "@/lib/catalog/public-brand";
import type { ReferenceBrandOption } from "@/lib/reference/types";

function displayName(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function price(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicBrand(slug);
  const name = data.brand?.name ?? displayName(slug);
  return {
    title: `${name} jeans size translation`,
    description: data.brand
      ? `Explore ${data.models.length} indexed ${name} fits and see which tagged size matches your favorite jeans.`
      : `Rober is building its ${name} jeans fit index.`,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicBrand(slug);
  const brand: ReferenceBrandOption =
    data.brand ?? {
      slug,
      name: displayName(slug),
      indexed: false,
      modelCount: 0,
    };
  const priceValues = data.products.map((product) => product.priceCents);
  const minPrice = priceValues.length ? Math.min(...priceValues) : null;
  const maxPrice = priceValues.length ? Math.max(...priceValues) : null;
  const sizeCount = data.products.reduce(
    (count, product) => count + product.sizeCount,
    0,
  );

  if (!data.brand) {
    return (
      <div className="mx-auto max-w-shell px-5 py-16 lg:px-8 lg:py-24">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All brands
        </Link>
        <section className="mt-12 max-w-3xl border-y border-border py-14">
          <p className="text-xs font-bold uppercase text-primary">Indexing</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
            We have not indexed {brand.name} yet.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            You can still use your tagged size as a starter reference. Rober will
            queue the model for chart review and keep the uncertainty visible.
          </p>
          <div className="mt-8">
            <BrandAnchorButton brand={brand} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-shell px-5 py-12 lg:px-8 lg:py-16">
      <Link
        href="/brands"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All brands
      </Link>

      <Reveal className="mt-8 grid gap-10 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
            <Database aria-hidden="true" className="size-4" />
            Published fit index
          </div>
          <h1 className="mt-4 font-serif text-6xl leading-[0.96] sm:text-7xl">
            {brand.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Model-level jeans sizing translated into garment measurements Rober
            can compare with the pair you already trust.
          </p>
        </div>
        <BrandAnchorButton brand={brand} />
      </Reveal>

      <dl className="grid grid-cols-2 border-b border-border py-7 sm:grid-cols-4">
        {[
          [data.models.length.toString(), "reference models"],
          [data.products.length.toString(), "denim styles"],
          [sizeCount.toLocaleString(), "size options"],
          [
            minPrice === null || maxPrice === null
              ? "—"
              : minPrice === maxPrice
                ? price(minPrice)
                : `${price(minPrice)}–${price(maxPrice)}`,
            "benchmark prices",
          ],
        ].map(([value, label]) => (
          <div
            key={label}
            className="border-l border-border px-4 first:border-l-0 first:pl-0 sm:px-6"
          >
            <dt className="text-xs font-bold uppercase text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums sm:text-3xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-10 border-b border-border py-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Reference map</p>
          <h2 className="mt-3 font-serif text-4xl">Indexed models and sizes</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            These are tagged-size references, normalized for comparison. They
            are not live stock records.
          </p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {data.models.map((model) => (
            <div
              key={model.name}
              className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <p className="font-serif text-xl font-semibold">{model.name}</p>
              <p className="text-sm text-muted-foreground">
                {model.sizes.length} tagged sizes · {model.sizes.slice(0, 4).join(", ")}
                {model.sizes.length > 4 ? "…" : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12" aria-labelledby="brand-styles">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Fit-ready catalog</p>
            <h2 id="brand-styles" className="mt-2 font-serif text-4xl">
              {brand.name} jeans in the index
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Prices are benchmark inputs for the demo, not a claim of live
            retailer inventory.
          </p>
        </div>

        <RevealGroup className="grid gap-x-5 gap-y-10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.slice(0, 18).map((product, index) => (
            <RevealItem key={product.id}>
              <Link
                href={`/style/${product.id}`}
                className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-card">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 390px"
                    className="object-contain px-8 py-7 transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
                  />
                </div>
                <div className="border-b border-border py-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-2xl font-semibold leading-tight">
                      {product.title}
                    </h3>
                    <p className="font-serif text-xl tabular-nums">
                      {price(product.priceCents)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.sizeCount} sizes · {product.fitFamilies.join(", ")}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase text-primary">
                    {product.sourceLabel}
                  </p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>

        {data.products.length === 0 ? (
          <div className="border-y border-border py-12 text-center">
            <p className="font-serif text-2xl">Product enrichment is indexing.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The reference chart is live; imagery and benchmark prices are next.
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border py-8">
        <div className="flex max-w-2xl items-start gap-3 text-sm leading-6 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fit-high" />
          <p>
            Source provenance remains attached to each fit record. Rober does
            not imply an affiliation with {brand.name}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/matches">
            Open the fit index
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
