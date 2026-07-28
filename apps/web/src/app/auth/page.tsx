import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { getAuthProviderSettings } from "@/lib/supabase/auth-settings";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Keep your Rober fit memory across devices.",
};

export default async function AuthPage() {
  const providers = await getAuthProviderSettings();

  return (
    <main className="mx-auto grid min-h-[680px] max-w-shell items-center px-5 py-16 lg:grid-cols-[1fr_0.8fr] lg:gap-20 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-sans text-xs font-bold uppercase text-primary">
          Your account
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[0.98] sm:text-6xl">
          Keep the fit memory you already built.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-base leading-7 text-muted-foreground">
          Sign in after choosing a reference pair. Guest anchors merge into your
          account, so the product never makes login the price of trying it.
        </p>
      </div>
      <div className="mt-12 lg:mt-0">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse border-y border-border bg-muted" />
          }
        >
          <AuthPanel providers={providers} />
        </Suspense>
      </div>
    </main>
  );
}
