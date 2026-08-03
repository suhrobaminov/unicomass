import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Generate a short personalized narrative from the user's top traits and majors.
export const generateMajorInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const data = raw as {
      profileLabel: string;
      topTraits: Array<[string, number]>;
      topMajors: Array<{ name: string; score: number }>;
    };
    if (!data || !Array.isArray(data.topTraits) || !Array.isArray(data.topMajors)) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { openaiChat, buildMajorInsightPrompt } = await import("@/lib/openai.server");
    const narrative = await openaiChat({
      messages: [{ role: "user", content: buildMajorInsightPrompt(data) }],
      temperature: 0.7,
    });
    return { narrative };
  });


// Save an in-progress assessment (autosave).
export const upsertAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = raw as { id?: string; answers: Record<string, number> };
    if (!d || typeof d.answers !== "object") throw new Error("Invalid");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { error } = await supabase
        .from("major_assessments")
        .update({ answers: data.answers })
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("major_assessments")
      .insert({ user_id: userId, answers: data.answers, status: "in_progress" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

// Finalize an assessment with computed results.
export const finalizeAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const d = raw as {
      id?: string;
      answers: Record<string, number>;
      trait_scores: Record<string, number>;
      results: Record<string, unknown>;
    };
    if (!d || !d.answers || !d.trait_scores || !d.results) throw new Error("Invalid");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      answers: data.answers as never,
      trait_scores: data.trait_scores as never,
      results: data.results as never,
      status: "completed" as const,
    };
    if (data.id) {
      const { error } = await supabase
        .from("major_assessments")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("major_assessments")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });
