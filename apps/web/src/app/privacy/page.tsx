import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Rober handles fit references and product analytics.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
      <p className="text-xs font-bold uppercase text-primary">Last updated July 28, 2026</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Privacy at Rober</h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Rober needs a fit reference to translate jeans sizing. It does not need
        to sell personal measurements or place them inside analytics events.
      </p>

      <div className="mt-12 space-y-10 border-t border-border pt-10 text-base leading-7">
        <section>
          <h2 className="font-serif text-3xl">What we store</h2>
          <p className="mt-3 text-muted-foreground">
            Guest reference pairs and saved items remain in browser storage.
            Signed-in accounts can sync reference garments, recommended sizes,
            saved products, profile details, and order-memory choices to Rober&apos;s
            database.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">What we measure</h2>
          <p className="mt-3 text-muted-foreground">
            Product analytics may record events such as creating a reference,
            viewing matches, moving the fit slider, saving a style, or leaving
            for a retailer. Analytics payloads exclude raw waist, rise, thigh,
            hip, and inseam measurements.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Catalog evidence</h2>
          <p className="mt-3 text-muted-foreground">
            Rober archives source snapshots and normalized factual size-chart
            data for provenance, review, refresh, and takedown operations. This
            catalog evidence is separate from user-owned fit memory.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Control and deletion</h2>
          <p className="mt-3 text-muted-foreground">
            You can remove guest data by clearing browser storage and remove
            saved items inside the product. Account export and deletion requests
            can be sent to privacy@rober.ai while self-service account controls
            are being finalized.
          </p>
        </section>
      </div>
    </article>
  );
}
