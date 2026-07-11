import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPT = `You are a veteran Ivy League admissions officer with 20+ years of experience. You are highly critical, precise, and holistic. You evaluate how a student's course rigor aligns with their intended major, weigh leadership and impact over sheer activity count, and recommend a calibrated school list.

You MUST respond with STRICT valid JSON matching this schema — no prose, no markdown, no code fences:
{
  "profile_strength_score": integer 1-100,
  "summary_bullets": string[] (3-5 short strategy bullets),
  "categorized_schools": [
    { "school_name": string, "tier": "Reach"|"Target"|"Safety", "admission_rate_estimate": string (e.g. "~5%"), "reason_for_tier": string (exactly 2 sentences tied to this student's stats) }
  ] (5 Reach + 5 Target + 4 Safety recommended),
  "profile_gaps": string[] (3-6 specific weaknesses),
  "actionable_next_steps": string[] (4-5 chronological, concrete steps)
}`;

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: ecs }, { data: awards }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("extracurriculars").select("*").eq("user_id", userId),
      supabase.from("awards").select("*").eq("user_id", userId),
    ]);

    if (!profile) throw new Error("Please complete your profile first.");

    const userPayload = { profile, extracurriculars: ecs ?? [], awards: awards ?? [] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Evaluate this student profile holistically. Return JSON only.\n\n${JSON.stringify(userPayload, null, 2)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI.");

    let parsed;
    try { parsed = JSON.parse(content); }
    catch { throw new Error("AI returned invalid JSON."); }

    const { data: inserted, error: insErr } = await supabase
      .from("reports")
      .insert({ user_id: userId, payload: parsed })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return inserted;
  });
