// AI access for UniCompass. Server-only — never import from client code.
//
// Primary path: the built-in Lovable AI gateway (no user-supplied key needed).
// Fallback path: a direct Google Gemini API key (GEMINI_API_KEY starting with "AIza").

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
};

/** Default model — fast and cost-effective. */
export const DEFAULT_MODEL = "gemini-flash-latest";

/** Model used on the Lovable gateway fallback path. */
const GATEWAY_MODEL = "google/gemini-2.5-flash";

/** Model used on the Groq fallback path. */
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function friendlyError(status: number, text: string): Error {
  if (status === 401 || status === 403) return new Error("AI service rejected the credentials.");
  if (status === 429) return new Error("AI is busy right now. Please try again in a moment.");
  if (status === 402) return new Error("AI credits exhausted. Please top up to continue.");
  if (status >= 500) return new Error("The AI provider is temporarily unavailable.");
  return new Error(`AI error: ${text.slice(0, 200)}`);
}

async function viaGateway(opts: Required<Pick<ChatOptions, "messages">> & ChatOptions): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI service is not configured.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      messages: opts.messages,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) throw friendlyError(res.status, await res.text());

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

async function viaGoogle(opts: ChatOptions & { messages: ChatMessage[] }): Promise<string> {
  const apiKey = process.env["GEMINI_API_KEY"]!;
  const model = (opts.model ?? DEFAULT_MODEL).replace(/^google\//, "");

  const systemText = opts.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Google AI Studio issues both legacy "AIza" and newer "AQ." keys; both are
  // sent the same way, as an x-goog-api-key header.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents,
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        generationConfig: {
          ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
          ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        },
      }),
    },
  );

  if (!res.ok) throw friendlyError(res.status, await res.text());

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

async function viaGroq(opts: ChatOptions): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"]!;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: opts.messages,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw friendlyError(res.status, await res.text());
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

export async function geminiChat(opts: ChatOptions): Promise<string> {
  const googleKey = process.env["GEMINI_API_KEY"]?.trim();
  const hasGoogleKey = !!googleKey;
  const hasGateway = !!process.env["LOVABLE_API_KEY"];

  // Custom initialization: whatever GEMINI_API_KEY holds (AIza… or AQ.…) is used
  // as-is — no format validation, so Vercel can inject the key freely.
  const hasGroq = !!process.env["GROQ_API_KEY"]?.trim();

  if (hasGoogleKey) {
    try {
      return await viaGoogle(opts);
    } catch (err) {
      if (!hasGroq && !hasGateway) throw err;
      console.error("[AI] direct Gemini call failed, trying fallback:", err);
    }
  }

  if (hasGroq) {
    try {
      return await viaGroq(opts);
    } catch (err) {
      if (!hasGateway) throw err;
      console.error("[AI] Groq call failed, falling back to gateway:", err);
    }
  }

  if (hasGateway) return viaGateway(opts);
  throw new Error("AI service is not configured.");
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
