import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/local-store";

export type SyncResult =
  | { status: "guest" }
  | { status: "synced" }
  | { status: "error"; message: string };

/** Academic fields only — every key here is a real column on public.profiles. */
export function buildProfileRow(userId: string, profile: Profile) {
  return {
    user_id: userId,
    full_name: profile.full_name.trim() || null,
    region: profile.region.trim() || null,
    intended_majors: profile.intended_majors.trim() || null,
    graduation_year: profile.graduation_year,
    gpa_unweighted: profile.gpa_unweighted,
    gpa_weighted: profile.gpa_weighted,
    class_rank: profile.class_rank.trim() || null,
    sat_score: profile.sat_score,
    act_score: profile.act_score,
    ap_count: profile.ap_count ?? 0,
    ib_count: profile.ib_count ?? 0,
    honors_count: profile.honors_count ?? 0,
  };
}

/**
 * Mirrors the locally saved academic profile into the signed-in user's
 * `profiles` row (one row per user — user_id is UNIQUE). Guests stay local-only.
 * Waits for the stored session so it never runs before auth is ready.
 */
export async function syncProfileToAccount(profile: Profile): Promise<SyncResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { status: "guest" };
  const { data, error: userError } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (userError || !userId) return { status: "guest" };
  const { error } = await supabase
    .from("profiles")
    .upsert(buildProfileRow(userId, profile), { onConflict: "user_id" });
  if (error) return { status: "error", message: error.message };
  return { status: "synced" };
}
