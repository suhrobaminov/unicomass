import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

// Local augmentation for the existing migration, without editing generated types.
export type SiteFeedback = { id: number; category: string; message: string; created_at: string };
type FeedbackDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      site_feedback: {
        Row: SiteFeedback;
        Insert: { category: string; message: string };
        Update: { category?: string; message?: string };
        Relationships: [];
      };
    };
  };
};
export const feedbackClient = supabase as unknown as SupabaseClient<FeedbackDatabase>;