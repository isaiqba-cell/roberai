import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminAccess() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return { supabase, user };
}
