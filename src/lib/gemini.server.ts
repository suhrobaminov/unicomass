// AI access for UniCompass. Server-only — never import from client code.
//
// Uses the modern Google Gen AI SDK (@google/genai) initialized directly with
// process.env.GEMINI_API_KEY, so any key format (legacy "AIza…" or the newer
// "AQ.…" keys) works without local validation blocks.

import { GoogleGenAI } from "@google/genai";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
};

/** Default model — fast and cost-effective. */
export const DEFAULT_MODEL = "gemini-3.8-flash";

function friendlyError(err: unknown): Error {
  const text = err instanceof Error ? err.message : String(err);
  if (/401|403|API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text)) {
    return new Error("AI service rejected the credentials.");
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(text)) {
    return new Error("AI is busy right now. Please try again in a moment.");
  }
  if (/5\d\d|UNAVAILABLE|INTERNAL/i.test(text)) {
    return new Error("The AI provider is temporarily unavailable.");
  }
  return new Error(`AI error: ${text.slice(0, 200)}`);
}

const GEMINI_FALLBACK_MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];

/** Bounded retry for transient provider errors before moving to the next model. */
const MAX_ATTEMPTS_PER_MODEL = 3;
const RETRY_BASE_DELAY_MS = 500;

function isTransient(err: unknown): boolean {
  const t = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|quota|rate limit|5\d\d|UNAVAILABLE|INTERNAL|overloaded|timeout|timed out|network|fetch failed/i.test(
    t,
  );
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const GROQ_MODEL = "openai/gpt-oss-120b";

async function callGemini(apiKey: string, model: string, opts: ChatOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = opts.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const res = await ai.models.generateContent({
    model,
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    },
  });
  const content = (res.text ?? "").trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

async function callGroq(apiKey: string, opts: ChatOptions): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: opts.messages,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  const content = (json.choices?.[0]?.message?.content ?? "").trim();
  if (!content) throw new Error("No response from AI.");
  return content;
}

/**
 * Tries Gemini (requested model, then stable fallbacks), then Groq if a
 * GROQ_API_KEY is configured. Every failure is logged server-side; the last
 * error is surfaced to the user so nothing fails silently.
 */
function classify(err: unknown): string {
  const t = err instanceof Error ? err.message : String(err);
  if (/API key not valid|API_KEY_INVALID|invalid_api_key|Invalid API Key|401|403|PERMISSION_DENIED|UNAUTHENTICATED/i.test(t)) return "key rejected (invalid or revoked)";
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(t)) return "quota/rate limit reached";
  if (/404|not found|NOT_FOUND/i.test(t)) return "model not available for this key";
  if (/5\d\d|UNAVAILABLE|INTERNAL|overloaded/i.test(t)) return "provider temporarily unavailable";
  return "request failed";
}

export async function geminiChat(opts: ChatOptions): Promise<string> {
  const geminiKey = process.env["GEMINI_API_KEY"]?.trim();
  const groqKey = process.env["GROQ_API_KEY"]?.trim();
  if (!geminiKey && !groqKey) {
    throw new Error(
      "AI is not configured: neither GEMINI_API_KEY nor GROQ_API_KEY is set on the server. Add one in your hosting environment variables and redeploy.",
    );
  }

  const problems: string[] = [];
  if (geminiKey) {
    const primary = (opts.model ?? DEFAULT_MODEL).replace(/^google\//, "");
    const models = [primary, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primary)];
    let geminiIssue = "";
    for (const model of models) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
        try {
          return await callGemini(geminiKey, model, opts);
        } catch (err) {
          geminiIssue = classify(err);
          console.error(
            `[ai] Gemini ${model} failed (attempt ${attempt}):`,
            err instanceof Error ? err.message : err,
          );
          // Invalid key: retrying or trying other models with the same key won't help.
          if (geminiIssue.startsWith("key rejected")) break;
          // Transient provider issues get bounded retries with exponential backoff.
          if (attempt < MAX_ATTEMPTS_PER_MODEL && isTransient(err)) {
            await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
            continue;
          }
          break; // Non-transient failure — move on to the next model.
        }
      }
      if (geminiIssue.startsWith("key rejected")) break;
    }
    problems.push(`Gemini: ${geminiIssue}`);
  } else {
    problems.push("GEMINI_API_KEY: not set");
  }
  if (groqKey) {
    try {
      return await callGroq(groqKey, opts);
    } catch (err) {
      console.error("[ai] Groq fallback failed:", err instanceof Error ? err.message : err);
      problems.push(`Groq: ${classify(err)}`);
    }
  } else {
    problems.push("GROQ_API_KEY: not set");
  }
  const providerDown = problems.some((p) =>
    /temporarily unavailable|quota\/rate limit|overloaded/i.test(p),
  );
  const keyIssue = !providerDown && problems.some((p) => /not set|key rejected/i.test(p));
  let advice: string;
  if (keyIssue) {
    advice = " Update the missing or invalid key in your hosting environment variables and redeploy.";
  } else if (providerDown) {
    advice =
      " The AI provider is temporarily unavailable or rate-limited — please try again in a few minutes.";
  } else {
    advice = " Please try again shortly.";
  }
  throw new Error(`AI request failed — ${problems.join("; ")}.${advice}`);
}
void friendlyError;

export const ADMISSIONS_SYSTEM_PROMPT = `You are a veteran Ivy League admissions officer with 20+ years of experience. You are highly critical, precise, and holistic. You evaluate how a student's course rigor aligns with their intended major, weigh leadership and impact over sheer activity count, and recommend a calibrated school list.

Output rules (non-negotiable):
- Return a SINGLE JSON object. No prose, no markdown, no code fences.
- Use EXACTLY these key names and types. Do not rename, nest, or add keys.
- "tier" must be exactly one of the strings "Reach", "Target" or "Safety" (capitalised).
- Never group schools under separate "reach"/"target"/"safety" arrays — every school goes in the flat "categorized_schools" array with its own "tier" field.
- Every field must be present, even if you must write a short placeholder.

Schema:
{
  "profile_strength_score": integer 1-100,
  "summary_bullets": string[] (3-5 short strategy bullets),
  "categorized_schools": [
    { "school_name": string, "tier": "Reach"|"Target"|"Safety", "admission_rate_estimate": string (approximate historical selectivity, e.g. "~5%"), "reason_for_tier": string (exactly 2 sentences tied to this student's stats), "review": string (2-3 sentence assessment of how well this school fits the student's intended major, strengths and gaps) }
  ] (exactly 5 with tier "Reach", 5 with tier "Target", 4 with tier "Safety"; real, accredited universities only),
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
