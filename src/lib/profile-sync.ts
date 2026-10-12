import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/local-store";

/**
 * Mirrors the locally saved academic profile into the signed-in user's
 * `profiles` row. Anonymous visitors stay local-only. Only academic fields
 * are written — never credentials.
 */
export async function syncProfileToAccount(profile: Profile): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  const row = {
    user_id: userId,
    full_name: profile.full_name || null,
    region: profile.region || null,
    intended_majors: profile.intended_majors || null,
    graduation_year: profile.graduation_year,
    gpa_unweighted: profile.gpa_unweighted,
    gpa_weighted: profile.gpa_weighted,
    class_rank: profile.class_rank || null,
    sat_score: profile.sat_score,
    act_score: profile.act_score,
    ap_count: profile.ap_count,
    ib_count: profile.ib_count,
    honors_count: profile.honors_count,
  };
  const existing = await supabase.from("profiles").select("id").eq("user_id", userId).limit(1).maybeSingle();
  if (existing.error) { console.error("Profile sync read failed:", existing.error.message); return; }
  const res = existing.data
    ? await supabase.from("profiles").update(row).eq("id", existing.data.id)
    : await supabase.from("profiles").insert(row);
  if (res.error) console.error("Profile sync failed:", res.error.message);
}
