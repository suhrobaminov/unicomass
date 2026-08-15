import { createServerFn } from "@tanstack/react-start";

// Generate a short personalized narrative from the user's top traits and majors.
// Results themselves are stored locally in the browser — no account required.
export const generateMajorInsight = createServerFn({ method: "POST" })
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
    const { geminiChat, buildMajorInsightPrompt } = await import("@/lib/gemini.server");
    const narrative = await geminiChat({
      messages: [{ role: "user", content: buildMajorInsightPrompt(data) }],
      temperature: 0.7,
    });
    return { narrative };
  });
