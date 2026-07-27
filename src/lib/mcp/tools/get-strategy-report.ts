import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_strategy_report",
  title: "Get strategy report",
  description:
    "Read one full UniCompass admissions strategy report by id: profile strength score, reach/target/safety universities, profile gaps and next steps. Omit the id to get the most recent report.",
  inputSchema: {
    report_id: z
      .string()
      .optional()
      .describe("Report id from list_strategy_reports. Omit for the latest report."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ report_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("reports")
      .select("id, created_at, payload, completed_steps")
      .eq("user_id", ctx.getUserId());
    query = report_id
      ? query.eq("id", report_id)
      : query.order("created_at", { ascending: false }).limit(1);
    const { data, error } = await query.maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok({ report: null, note: "No matching report found." });
    return ok({ report: data });
  },
});
