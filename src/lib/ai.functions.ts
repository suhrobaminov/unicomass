import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { openaiChat, ADMISSIONS_SYSTEM_PROMPT } = await import("@/lib/openai.server");
    const { supabase, userId } = context;

    const [{ data: profile }, { data: ecs }, { data: awards }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("extracurriculars").select("*").eq("user_id", userId),
      supabase.from("awards").select("*").eq("user_id", userId),
    ]);

    if (!profile) throw new Error("Please complete your profile first.");

    const userPayload = { profile, extracurriculars: ecs ?? [], awards: awards ?? [] };

    const content = await openaiChat({
      jsonMode: true,
      messages: [
        { role: "system", content: ADMISSIONS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Evaluate this student profile holistically. Return JSON only.\n\n${JSON.stringify(userPayload, null, 2)}`,
        },
      ],
    });

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
