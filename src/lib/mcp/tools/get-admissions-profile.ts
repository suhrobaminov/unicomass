import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_admissions_profile",
  title: "Get admissions profile",
  description:
    "Read the signed-in student's UniCompass admissions profile: academics (GPA, SAT/ACT, course rigor), graduation year, region and intended majors.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok({ profile: null, note: "No profile has been created yet." });
    return ok({ profile: data });
  },
});
