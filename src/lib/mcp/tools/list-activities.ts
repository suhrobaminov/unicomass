import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_activities",
  title: "List activities and awards",
  description:
    "List the signed-in student's extracurricular activities and honors/awards recorded in UniCompass.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [activities, awards] = await Promise.all([
      supabase.from("extracurriculars").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("awards").select("*").eq("user_id", userId).order("created_at"),
    ]);
    if (activities.error) return fail(activities.error.message);
    if (awards.error) return fail(awards.error.message);
    return ok({ extracurriculars: activities.data ?? [], awards: awards.data ?? [] });
  },
});
