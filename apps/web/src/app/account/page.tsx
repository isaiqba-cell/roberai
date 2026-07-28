import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/auth/profile-form";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Fit profile",
};

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect("/auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/account");
  }

  const [{ data: profile }, { count: anchorCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_anchor_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <main className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="font-sans text-xs font-bold uppercase text-primary">
            Fit profile
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none">
            Your fit memory
          </h1>
        </div>
        <ConfidenceBadge confidence={anchorCount ? 96 : 48} />
      </div>

      <div className="grid gap-12 py-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-sans text-xs font-bold uppercase text-muted-foreground">
            Signed in as
          </p>
          <p className="mt-2 break-all font-serif text-2xl">{user.email}</p>
          <p className="mt-8 font-serif text-5xl">{anchorCount ?? 0}</p>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Reference {anchorCount === 1 ? "pair" : "pairs"} saved
          </p>
        </div>
        <ProfileForm
          userId={user.id}
          initialDisplayName={
            profile?.display_name ??
            String(
              user.user_metadata.full_name ?? user.user_metadata.name ?? "",
            )
          }
        />
      </div>
    </main>
  );
}
