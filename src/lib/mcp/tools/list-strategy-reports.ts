import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_strategy_reports",
  title: "List strategy reports",
  description:
    "List the signed-in student's generated admissions strategy reports, newest first, with id, creation date and profile strength score.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("reports")
      .select("id, created_at, payload")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return fail(error.message);
    const items = (data ?? []).map((r) => {
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      return {
        id: r.id,
        created_at: r.created_at,
        profile_strength_score: payload.profile_strength_score ?? null,
      };
    });
    return ok({ reports: items });
  },
});
