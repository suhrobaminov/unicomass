import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_major_assessment",
  title: "Get major assessment results",
  description:
    "Read the signed-in student's latest completed 'Find Your Major' assessment: trait scores, top recommended majors and the persona summary.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("major_assessments")
      .select("id, created_at, updated_at, status, trait_scores, results")
      .eq("user_id", ctx.getUserId())
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok({ assessment: null, note: "No completed major assessment yet." });
    return ok({ assessment: data });
  },
});
