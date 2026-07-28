"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { slugifyBrand, type ReferenceBrandOption } from "@/lib/reference/types";

export function BrandPicker({
  brands,
  compact = false,
  onSelect,
}: {
  brands: ReferenceBrandOption[];
  compact?: boolean;
  onSelect: (brand: ReferenceBrandOption) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return brands.slice(0, 8);
    return brands
      .filter(
        (brand) =>
          brand.name.toLowerCase().includes(normalized) ||
          brand.slug.includes(normalized),
      )
      .slice(0, 8);
  }, [brands, query]);

  function chooseFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = query.trim();
    if (!name) return;
    const indexed = brands.find(
      (brand) =>
        brand.name.toLowerCase() === name.toLowerCase() ||
        brand.slug === slugifyBrand(name),
    );
    onSelect(
      indexed ?? {
        name,
        slug: slugifyBrand(name),
        indexed: false,
        modelCount: 0,
      },
    );
  }

  return (
    <div>
      <form onSubmit={chooseFreeText} className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor="anchor-brand" className="sr-only">
          Favorite jeans brand
        </label>
        <input
          id="anchor-brand"
          name="brand"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a jeans brand..."
          autoComplete="off"
          className="h-14 w-full rounded-md border border-input bg-background pl-12 pr-32 font-sans text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-2 h-10"
          disabled={!query.trim()}
        >
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>

      <div
        className={`mt-5 grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"}`}
      >
        {filtered.map((brand) => (
          <button
            key={brand.slug}
            type="button"
            onClick={() => onSelect(brand)}
            className="min-h-20 rounded-md border border-border bg-background px-4 py-3 text-left transition-colors hover:border-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block font-serif text-lg leading-tight">
              {brand.name}
            </span>
            <span className="mt-1 block font-sans text-xs text-muted-foreground">
              {brand.modelCount} indexed{" "}
              {brand.modelCount === 1 ? "fit" : "fits"}
            </span>
          </button>
        ))}
      </div>

      {query.trim() && filtered.length === 0 ? (
        <p className="mt-4 font-sans text-sm leading-6 text-muted-foreground">
          We have not indexed {query.trim()} yet. Continue anyway and we will
          build a starter reference from the tagged size.
        </p>
      ) : null}
    </div>
  );
}
