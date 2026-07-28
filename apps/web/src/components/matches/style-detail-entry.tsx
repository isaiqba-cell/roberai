import { StyleDetail } from "@/components/matches/style-detail";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function StyleDetailEntry({
  productId,
  overlay = false,
}: {
  productId: string;
  overlay?: boolean;
}) {
  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const anchorResult =
    supabase && user
      ? await supabase
          .from("user_anchor_items")
          .select("resolved_spec")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle()
      : null;

  return (
    <StyleDetail
      productId={productId}
      overlay={overlay}
      authenticated={Boolean(user)}
      accountAnchor={anchorResult?.data?.resolved_spec ?? null}
    />
  );
}
