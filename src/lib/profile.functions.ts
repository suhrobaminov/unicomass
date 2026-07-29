import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Creates the caller's profile row if it doesn't exist yet.
 * Safe to call on every sign-in — it never overwrites existing data.
 */
export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing, error: readError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return { created: false };

    const meta = (context.claims?.user_metadata ?? {}) as Record<string, unknown>;
    const fullName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null;

    const { error } = await context.supabase
      .from("profiles")
      .insert({ user_id: context.userId, full_name: fullName });
    // Unique violation = another tab won the race; that's fine.
    if (error && error.code !== "23505") throw error;
    return { created: true };
  });
