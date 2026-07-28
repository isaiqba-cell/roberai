import Image from "next/image";
import Link from "next/link";
import { Check, Ruler } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AnchorStart } from "@/components/onboarding/anchor-start";
import { Button } from "@/components/ui/button";
import { getReferenceBrands } from "@/lib/reference/server";

const denimImages = [
  {
    src: "/images/jeans/apc-elisabeth.webp",
    alt: "Dark indigo straight-leg jeans",
  },
  {
    src: "/images/jeans/agolde-straight.jpg",
    alt: "Mid-wash high-rise straight jeans",
  },
  {
    src: "/images/jeans/light-packshot.webp",
    alt: "Light-wash relaxed straight jeans",
  },
];

export default async function HomePage() {
  const brands = await getReferenceBrands();

  return (
    <div className="mx-auto max-w-shell px-5 py-12 lg:px-8 lg:py-16">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="font-sans text-xs font-bold uppercase text-primary">
              Your fit profile
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.98] sm:text-6xl">
              Start with the jeans you already trust.
            </h1>
          </div>
          <p className="font-sans text-sm text-muted-foreground">
            {brands.length} reference brands indexed
          </p>
        </div>
      </Reveal>

      <section className="grid border-b border-border lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="flex min-h-[430px] flex-col justify-center border-b border-border py-10 lg:border-b-0 lg:border-r lg:pr-12">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Ruler aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-8 font-serif text-4xl leading-tight">
            Add one reference pair.
          </h2>
          <p className="mt-4 max-w-md font-sans text-base leading-7 text-muted-foreground">
            Brand, style, and tagged size are enough to establish a fit anchor.
            Rober uses that garment as the baseline for every recommendation.
          </p>
          <div className="mt-8">
            <AnchorStart brands={brands} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/playground">View system</Link>
            </Button>
          </div>
        </Reveal>

        <RevealGroup className="grid min-h-[430px] grid-cols-3 gap-px bg-border lg:pl-px">
          {denimImages.map((image, index) => (
            <RevealItem
              key={image.src}
              className="relative min-h-[430px] overflow-hidden bg-card"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 33vw, 240px"
                className="object-contain px-3 py-8 transition-transform duration-200 hover:scale-[1.02]"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <RevealGroup className="grid border-b border-border md:grid-cols-3">
        {[
          ["01", "Anchor", "The pair you know fits"],
          ["02", "Translate", "Measurements normalized by brand"],
          ["03", "Choose", "Size and fit confidence together"],
        ].map(([number, title, copy]) => (
          <RevealItem
            key={number}
            className="min-h-48 border-b border-border py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-3xl text-primary">{number}</span>
              <Check aria-hidden="true" className="size-4 text-fit-high" />
            </div>
            <h2 className="mt-10 font-serif text-2xl">{title}</h2>
            <p className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
              {copy}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
