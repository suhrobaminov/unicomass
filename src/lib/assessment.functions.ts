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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured.");

    const prompt = `You are a warm, insightful career coach. Write a 3-4 sentence personalized narrative (2nd person) for a student.

Profile: ${data.profileLabel}
Top traits (0-1 strength): ${data.topTraits.map(([k, v]) => `${k}:${v.toFixed(2)}`).join(", ")}
Top matched majors: ${data.topMajors.map((m) => `${m.name} (${Math.round(m.score * 100)}%)`).join(", ")}

Explain what these signals reveal about how they think and what environments will let them thrive. Do NOT list majors — refer to them collectively. Be specific, warm, and confidence-building. Return plain text only, no headings or bullets.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI error: ${(await res.text()).slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { narrative: text };
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
      answers: data.answers,
      trait_scores: data.trait_scores,
      results: data.results,
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
