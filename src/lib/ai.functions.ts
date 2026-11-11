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

    const { normalizeReport } = await import("@/lib/report-normalize");
    // Retry once if the model returns malformed JSON or no schools.
    for (let attempt = 0; attempt < 2; attempt++) {
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

    const report = normalizeReport(content);
    const tierCounts = report.categorized_schools.reduce(
      (counts, school) => {
        counts[school.tier] += 1;
        return counts;
      },
      { Reach: 0, Target: 0, Safety: 0 },
    );
    const hasAllTiers = tierCounts.Reach > 0 && tierCounts.Target > 0 && tierCounts.Safety > 0;
    if (report.categorized_schools.length >= 3 && hasAllTiers) return report;
    console.error("[ai] report did not include usable recommendations in all tiers; attempt", attempt + 1);
    }
    throw new Error("UniCompass could not produce a reliable shortlist across Reach, Target, and Safety. No universities were invented to fill missing categories. Please try again or review your profile inputs.");
  });

