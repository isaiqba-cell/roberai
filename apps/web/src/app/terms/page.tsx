import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Rober's fit translation demo.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
      <p className="text-xs font-bold uppercase text-primary">Last updated July 28, 2026</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Rober terms</h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Rober is a fit-translation product. Recommendations support a shopping
        decision; they do not guarantee a retailer&apos;s inventory, tailoring, or
        final fit.
      </p>

      <div className="mt-12 space-y-10 border-t border-border pt-10 text-base leading-7">
        <section>
          <h2 className="font-serif text-3xl">Recommendations</h2>
          <p className="mt-3 text-muted-foreground">
            Fit confidence is an estimate derived from the reference garment,
            normalized chart evidence, construction, stretch, and stated fit
            direction. Bodies, garment batches, laundering, and personal
            preference can change the result.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Retailer links</h2>
          <p className="mt-3 text-muted-foreground">
            Product links open third-party sites. Benchmark prices and images in
            this demo may not reflect live inventory. Unless explicitly stated,
            Rober is not affiliated with or endorsed by the brands and retailers
            represented in the fit index.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Permitted use</h2>
          <p className="mt-3 text-muted-foreground">
            Use the service lawfully and do not attempt to bypass access
            controls, interfere with ingestion, extract private snapshots, or
            misrepresent Rober&apos;s data as a retailer partnership.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Source concerns</h2>
          <p className="mt-3 text-muted-foreground">
            Rights holders and source operators can request correction or
            takedown at legal@rober.ai. Rober can unpublish a source and block a
            domain while the request is reviewed.
          </p>
        </section>
      </div>
    </article>
  );
}
