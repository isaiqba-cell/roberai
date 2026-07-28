"use client";

import { useRouter } from "next/navigation";

import { BrandPicker } from "@/components/onboarding/brand-picker";
import { writeAnchorDraft } from "@/lib/reference/draft";
import type { ReferenceBrandOption } from "@/lib/reference/types";

export function AnchorStart({ brands }: { brands: ReferenceBrandOption[] }) {
  const router = useRouter();

  function chooseBrand(brand: ReferenceBrandOption) {
    writeAnchorDraft(window.localStorage, {
      brandSlug: brand.slug,
      brandName: brand.name,
      indexedBrand: brand.indexed,
      modelName: "",
      sizeLabel: "",
    });
    router.push("/onboarding?step=details");
  }

  return <BrandPicker brands={brands} compact onSelect={chooseBrand} />;
}
