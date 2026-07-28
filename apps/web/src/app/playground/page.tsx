import { ThemeShowcase } from "@/components/playground/theme-showcase";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <Reveal>
        <p className="font-sans text-xs font-bold uppercase text-primary">
          Design system
        </p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.98] sm:text-6xl">
          The pieces behind a calmer fit decision.
        </h1>
        <p className="mt-6 max-w-2xl font-sans text-base leading-7 text-muted-foreground">
          Every control is keyboard-ready, motion-aware, and shown against both
          of Rober&apos;s production palettes.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-8 xl:grid-cols-2">
        <RevealItem>
          <ThemeShowcase theme="light" />
        </RevealItem>
        <RevealItem>
          <ThemeShowcase theme="dark" />
        </RevealItem>
      </RevealGroup>
    </div>
  );
}
