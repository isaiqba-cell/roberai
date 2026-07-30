"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { writeAnchorDraft } from "@/lib/reference/draft";
import type { ReferenceBrandOption } from "@/lib/reference/types";

export function BrandAnchorButton({ brand }: { brand: ReferenceBrandOption }) {
  const router = useRouter();

  return (
    <Button
      size="lg"
      onClick={() => {
        writeAnchorDraft(window.localStorage, {
          brandSlug: brand.slug,
          brandName: brand.name,
          indexedBrand: brand.indexed,
          modelName: "",
          sizeLabel: "",
          source: "brand_page",
        });
        router.push("/onboarding?step=details");
      }}
    >
      Start with {brand.name}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
}
