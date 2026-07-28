import type { Metadata } from "next";
import { Suspense } from "react";

import { AnchorOnboarding } from "@/components/onboarding/anchor-onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { getReferenceBrands } from "@/lib/reference/server";

export const metadata: Metadata = {
  title: "Add your reference pair",
  description: "Translate the jeans you already trust into every other brand.",
};

export default async function OnboardingPage() {
  const brands = await getReferenceBrands();
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <AnchorOnboarding brands={brands} />
    </Suspense>
  );
}

function OnboardingFallback() {
  return (
    <main className="mx-auto max-w-shell px-5 py-14 lg:px-8">
      <div className="border-b border-border pb-6">
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mx-auto max-w-3xl py-20">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-5 h-28 w-full" />
        <Skeleton className="mt-8 h-14 w-full" />
      </div>
    </main>
  );
}
