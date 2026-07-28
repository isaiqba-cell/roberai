import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <p className="font-sans text-xs font-bold uppercase text-primary">
        Saved
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-none">
        Pairs worth revisiting
      </h1>
      <EmptyState
        className="mt-12"
        icon={<Heart aria-hidden="true" className="size-5" />}
        title="Nothing saved yet"
        description="Save a match to keep its recommended size, fit confidence, and comparison notes together."
        action={
          <Button asChild>
            <Link href="/matches">Browse matches</Link>
          </Button>
        }
      />
    </div>
  );
}
