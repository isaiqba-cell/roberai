import { ArrowUpRight, Database, Ruler, ShieldCheck } from "lucide-react";

import { webEnvironment } from "@/lib/env";

const foundations = [
  {
    icon: Ruler,
    title: "Shared fit engine",
    detail: "One tested matching contract for mobile and web.",
  },
  {
    icon: Database,
    title: "Seed-ready catalog",
    detail: "Local demo data keeps product work unblocked.",
  },
  {
    icon: ShieldCheck,
    title: "Production gates",
    detail: "Strict types, environment validation, and CI checks.",
  },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Rober home">
          Rober
        </a>
        <div className="runtime-pill">
          <span aria-hidden="true" />
          {webEnvironment.mode === "seed" ? "Seed demo" : "Live services"}
        </div>
      </header>

      <section id="top" className="stage-zero">
        <p className="eyebrow">Desktop storefront foundation</p>
        <h1>Find jeans by the pair that already fits.</h1>
        <p className="lede">
          Rober translates a trusted fit into comparable sizes across denim
          brands. The desktop experience is now wired into the same matching
          engine as mobile.
        </p>
        <div className="stage-badge">
          <span>Stage 0</span>
          Foundation ready for the storefront shell
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.6} />
        </div>
      </section>

      <section className="foundation-grid" aria-label="Platform foundations">
        {foundations.map(({ icon: Icon, title, detail }) => (
          <article key={title}>
            <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
            <h2>{title}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
