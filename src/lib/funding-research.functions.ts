import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

type StudentProfile = {
  homeCountry: string; degreeLevel: string; intendedMajor: string; graduationYear: string;
  gpa: string; sat: string; act: string; englishTest: string; englishScore: string;
  annualBudget: string; financialNeed: string; citizenship: string; notes: string;
};
type ResearchInput = { student: StudentProfile; universities: Array<{ name: string; url: string }> };

export const researchUniversityFunding = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const data = raw as ResearchInput;
    if (!data?.student || !Array.isArray(data.universities)) throw new Error("Please enter your profile and universities.");
    const keys: Array<keyof StudentProfile> = ["homeCountry","degreeLevel","intendedMajor","graduationYear","gpa","sat","act","englishTest","englishScore","annualBudget","financialNeed","citizenship","notes"];
    const student = Object.fromEntries(keys.map((key) => [key, String(data.student[key] ?? "").slice(0, 500)])) as StudentProfile;
    const universities = data.universities.slice(0, 5).map((u) => ({
      name: String(u.name ?? "").trim().slice(0, 120),
      url: String(u.url ?? "").trim().slice(0, 500),
    })).filter((u) => u.name);
    if (!universities.length) throw new Error("Enter at least one university name.");
    for (const uni of universities) {
      if (uni.url) {
        let url: URL;
        try { url = new URL(uni.url); } catch { throw new Error(`Invalid URL for ${uni.name}. Use a full https:// URL.`); }
        if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("University links must be public HTTPS URLs without credentials or custom ports.");
        if (!url.hostname.includes(".") || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error("Enter a public university website URL.");
      }
    }
    return { student, universities };
  })
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) throw new Error("AI research is not configured. Add GEMINI_API_KEY in Vercel and redeploy.");
    const ai = new GoogleGenAI({ apiKey: key });
    const universityList = data.universities.map((u, i) => `${i + 1}. ${u.name}${u.url ? ` — official URL supplied by student: ${u.url}` : ""}`).join("\n");
    const prompt = `Research official university sources for tuition and scholarships for this student. Use web search to find the universities' official domains and pages. Prioritize official university financial aid, international admissions, tuition, and scholarship pages. Do not rely on blogs/aggregators except to say official information could not be found. Never claim an award or admission is guaranteed. Do not invent amounts, eligibility criteria, deadlines, or source URLs. If evidence is missing, explicitly say "Not found". Distinguish merit aid, need-based aid, automatic awards, competitive awards, and loans where source supports it. If the user supplied a URL, treat it as a search hint and verify the page/domain; do not blindly trust its content.\n\nStudent profile:\n${JSON.stringify(data.student, null, 2)}\n\nUniversities to research:\n${universityList}\n\nReturn a JSON object with overallNote and findings array. Each finding must include university, sources array of {title,url,whyRelevant}, tuition {amount,period,studentCategory}, scholarships array of {name,amount,coverage,eligibilityStatus,eligibilityReason,deadline,renewalRules}, estimatedNetCost, missingRequirements, nextSteps, confidence. eligibilityStatus must be one of "criteria appear to match", "possible match — verify", "does not match a stated criterion", "insufficient information". Each non-empty fact must have source URLs in that finding's sources array. If a current tuition amount or aid amount cannot be verified, say so. Include concise quotations of at most 20 words per source as evidence where possible. Return valid JSON only.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.1, tools: [{ googleSearch: {} }] },
    });
    const text = (response.text ?? "").trim();
    if (!text) throw new Error("The research model returned no report. Please try again.");
    let report: Record<string, unknown>;
    try { report = JSON.parse(text) as Record<string, unknown>; }
    catch { throw new Error("The AI returned an unreadable report. Please retry."); }
    const findings = Array.isArray(report.findings) ? report.findings.slice(0, 5) : [];
    const grounding = (response as unknown as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }> }).candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const groundedSources = grounding.flatMap((chunk) => chunk.web?.uri ? [{ url: chunk.web.uri, title: chunk.web.title ?? chunk.web.uri }] : []);
    return {
      generatedAt: new Date().toISOString(),
      student: data.student,
      findings,
      groundedSources,
      overallNote: typeof report.overallNote === "string" ? report.overallNote : "Review each source and confirm details with the university.",
      disclaimer: "AI-generated research can be wrong or incomplete. Eligibility is a preliminary assessment, not an award or admission decision. Verify requirements, amounts, deadlines, and links directly with each university.",
    };
  });
