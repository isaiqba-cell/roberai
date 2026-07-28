import {
  AnchorMemory,
  type AccountAnchor,
} from "@/components/matches/anchor-memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  let anchors: AccountAnchor[] = [];
  if (supabase && user) {
    const result = await supabase
      .from("user_anchor_items")
      .select(
        "id,client_anchor_id,brand_name,style_name,tagged_size,category,active,resolved_spec,resolution_source,tight_or_loose_notes",
      )
      .eq("user_id", user.id)
      .order("active", { ascending: false })
      .order("created_at", { ascending: false });
    anchors = result.data ?? [];
  }

  return (
    <div className="mx-auto max-w-shell px-5 py-14 lg:px-8 lg:py-20">
      <p className="font-sans text-xs font-bold uppercase text-primary">
        Matches
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-none">
        Your translated fit
      </h1>
      <AnchorMemory accountAnchors={anchors} authenticated={Boolean(user)} />
    </div>
  );
}
