// Direct OpenAI API access. Server-only — never import from client code.
// Requires the OPENAI_API_KEY environment variable.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
};

/** Default model — matches the original product spec (GPT-4o mini). */
export const DEFAULT_MODEL = "gpt-4o-mini";

export async function openaiChat({
  model = DEFAULT_MODEL,
  messages,
  jsonMode = false,
  temperature,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured. Missing OPENAI_API_KEY.");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) throw new Error("AI service rejected the API key.");
    if (res.status === 429) throw new Error("AI is busy or out of quota. Please try again shortly.");
    if (res.status >= 500) throw new Error("The AI provider is temporarily unavailable.");
    throw new Error(`AI error: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

export const ADMISSIONS_SYSTEM_PROMPT = `You are a veteran Ivy League admissions officer with 20+ years of experience. You are highly critical, precise, and holistic. You evaluate how a student's course rigor aligns with their intended major, weigh leadership and impact over sheer activity count, and recommend a calibrated school list.

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

export function buildMajorInsightPrompt(data: {
  profileLabel: string;
  topTraits: Array<[string, number]>;
  topMajors: Array<{ name: string; score: number }>;
}): string {
  return `You are a warm, insightful career coach. Write a 3-4 sentence personalized narrative (2nd person) for a student.

Profile: ${data.profileLabel}
Top traits (0-1 strength): ${data.topTraits.map(([k, v]) => `${k}:${v.toFixed(2)}`).join(", ")}
Top matched majors: ${data.topMajors.map((m) => `${m.name} (${Math.round(m.score * 100)}%)`).join(", ")}

Explain what these signals reveal about how they think and what environments will let them thrive. Do NOT list majors — refer to them collectively. Be specific, warm, and confidence-building. Return plain text only, no headings or bullets.`;
}
