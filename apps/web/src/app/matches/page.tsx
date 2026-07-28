import Link from "next/link";
import { Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function MatchesPage() {
  return (
    <div className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <p className="font-sans text-xs font-bold uppercase text-primary">
        Matches
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-none">
        Your translated fit
      </h1>
      <EmptyState
        className="mt-12"
        icon={<Ruler aria-hidden="true" className="size-5" />}
        title="Add a reference pair first"
        description="Once your anchor is set, brand-diverse matches will appear here with the size to buy and a confidence score."
        action={
          <Button asChild>
            <Link href="/">Build fit profile</Link>
          </Button>
        }
      />
    </div>
  );
}
