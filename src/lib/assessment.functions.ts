import { createServerFn } from "@tanstack/react-start";

// Generate a short narrative from validated, bounded assessment output.
export const generateMajorInsight = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("Invalid assessment insight input.");
    }
    const data = raw as Record<string, unknown>;
    if (typeof data.profileLabel !== "string" || !Array.isArray(data.topTraits) || !Array.isArray(data.topMajors)) {
      throw new Error("Complete the major assessment before generating insights.");
    }

    const topTraits = data.topTraits.slice(0, 8).flatMap((item) => {
      if (!Array.isArray(item) || typeof item[0] !== "string") return [];
      const score = Number(item[1]);
      if (!Number.isFinite(score)) return [];
      return [[item[0].slice(0, 80), Math.max(0, Math.min(1, score))] as [string, number]];
    });
    const topMajors = data.topMajors.slice(0, 5).flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const major = item as Record<string, unknown>;
      if (typeof major.name !== "string") return [];
      const score = Number(major.score);
      if (!Number.isFinite(score)) return [];
      return [{ name: major.name.slice(0, 100), score: Math.max(0, Math.min(1, score)) }];
    });

    if (topTraits.length === 0 || topMajors.length === 0) {
      throw new Error("Your assessment did not produce enough valid signals. Please retake it.");
    }

    return {
      profileLabel: data.profileLabel.slice(0, 120),
      topTraits,
      topMajors,
    };
  })
  .handler(async ({ data }) => {
    const { geminiChat, buildMajorInsightPrompt } = await import("@/lib/gemini.server");
    const narrative = (await geminiChat({
      messages: [{ role: "user", content: buildMajorInsightPrompt(data) }],
      temperature: 0.7,
    })).trim();

    if (narrative.length < 30) {
      throw new Error("The AI returned an incomplete insight. Your ranked major results are still available; please try again.");
    }
    return { narrative: narrative.slice(0, 1200) };
  });
