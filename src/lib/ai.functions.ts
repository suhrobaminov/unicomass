import { createServerFn } from "@tanstack/react-start";

type ProfilePayload = {
  profile: Record<string, unknown>;
  extracurriculars: Array<Record<string, unknown>>;
  awards: Array<Record<string, unknown>>;
};

// No accounts in this app: the profile is sent from the browser and the
// generated report is stored locally on the student's device.
export const generateReport = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const d = raw as ProfilePayload;
    if (!d || typeof d.profile !== "object" || d.profile === null) {
      throw new Error("Please complete your profile first.");
    }
    return {
      profile: d.profile,
      extracurriculars: Array.isArray(d.extracurriculars) ? d.extracurriculars.slice(0, 30) : [],
      awards: Array.isArray(d.awards) ? d.awards.slice(0, 30) : [],
    } satisfies ProfilePayload;
  })
  .handler(async ({ data }) => {
    const { geminiChat, ADMISSIONS_SYSTEM_PROMPT } = await import("@/lib/gemini.server");

    const content = await geminiChat({
      jsonMode: true,
      messages: [
        { role: "system", content: ADMISSIONS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Evaluate this student profile holistically. Return JSON only.\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    try {
      return JSON.parse(content) as {
        profile_strength_score: number;
        summary_bullets: string[];
        categorized_schools: Array<{
          school_name: string;
          tier: string;
          admission_rate_estimate: string;
          reason_for_tier: string;
        }>;
        profile_gaps: string[];
        actionable_next_steps: string[];
      };
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
  });
