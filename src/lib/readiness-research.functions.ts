import { createServerFn } from "@tanstack/react-start";

type ResearchInput = {
  university: string;
  program: string;
  degree: string;
  intake: string;
  citizenship: string;
};

const decode = (value: string) => value
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/g, "/");

const stripHtml = (html: string) => decode(html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")).trim();

function isOfficialish(url: string, university: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (!/^https?:$/.test(new URL(url).protocol) || /duckduckgo|google\.|bing\.|wikipedia|reddit|youtube|facebook|instagram|linkedin|commonapp|collegeboard/.test(host)) return false;
    const words = university.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3 && !["university", "college", "institute", "technology"].includes(w));
    return host.endsWith(".edu") || host.endsWith(".ac.uk") || host.endsWith(".edu.au") || host.endsWith(".ca") || words.some(w => host.includes(w));
  } catch { return false; }
}

export const researchUniversityRequirements = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): ResearchInput => {
    const d = raw as Partial<ResearchInput>;
    if (!d || typeof d.university !== "string" || d.university.trim().length < 2) throw new Error("Enter a university name.");
    return {
      university: d.university.trim().slice(0, 160),
      program: typeof d.program === "string" ? d.program.trim().slice(0, 160) : "",
      degree: typeof d.degree === "string" ? d.degree.slice(0, 40) : "Bachelor's",
      intake: typeof d.intake === "string" ? d.intake.slice(0, 60) : "",
      citizenship: typeof d.citizenship === "string" ? d.citizenship.slice(0, 80) : "",
    };
  })
  .handler(async ({ data }) => {
    const query = [data.university, data.program, data.degree, "international student admission requirements English proficiency SAT deadline official"].filter(Boolean).join(" ");
    const endpoint = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);
    const response = await fetch(endpoint, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; UniCompassAdmissionsResearch/1.0)", accept: "text/html" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Search provider returned HTTP " + response.status + ". Try again later.");
    const html = await response.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const blocks = html.match(/<div class="result[^"]*"[\s\S]*?(?=<div class="result[^"]*"|$)/gi) ?? [];
    for (const block of blocks) {
      const linkMatch = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;
      let url = decode(linkMatch[1]);
      try {
        const parsed = new URL(url, "https://html.duckduckgo.com");
        if (parsed.hostname.includes("duckduckgo.com") && parsed.searchParams.has("uddg")) url = parsed.searchParams.get("uddg")!;
      } catch { continue; }
      if (!isOfficialish(url, data.university)) continue;
      const snippetMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
      results.push({ title: stripHtml(linkMatch[2]).slice(0, 180), url, snippet: stripHtml(snippetMatch?.[1] ?? snippetMatch?.[2] ?? "").slice(0, 500) });
      if (results.length >= 8) break;
    }
    if (!results.length) return {
      query, researchedAt: new Date().toISOString(), status: "no-results",
      message: "Search completed, but no likely official university pages were found. Search may be blocked or the university domain may not match; no requirements have been guessed.",
      sources: [], findings: [],
    };
    const sources = await Promise.all(results.slice(0, 5).map(async item => {
      try {
        const page = await fetch(item.url, { headers: { "user-agent": "Mozilla/5.0 (compatible; UniCompassAdmissionsResearch/1.0)", accept: "text/html" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
        if (!page.ok) return { ...item, pageStatus: "blocked", pageText: "" };
        const type = page.headers.get("content-type") ?? "";
        if (!type.includes("text/html")) return { ...item, pageStatus: "not-html", pageText: "" };
        const body = (await page.text()).slice(0, 800_000);
        const text = stripHtml(body).slice(0, 16_000);
        return { ...item, url: page.url || item.url, pageStatus: text.length > 100 ? "read" : "unreadable", pageText: text };
      } catch {
        return { ...item, pageStatus: "blocked", pageText: "" };
      }
    }));
    const categories = [
      { key: "English language", regex: /\b(IELTS|TOEFL|Duolingo English Test|English language proficiency|minimum English)\b/i },
      { key: "SAT / ACT", regex: /\b(SAT|ACT|test optional|standardized test)\b/i },
      { key: "GPA / academic grades", regex: /\b(GPA|grade point average|minimum average|academic requirements|secondary school grades)\b/i },
      { key: "Application deadlines", regex: /\b(deadline|application date|apply by|priority date|application period)\b/i },
      { key: "Required documents", regex: /\b(transcript|recommendation letter|personal statement|passport|supporting documents|school report)\b/i },
      { key: "International applicants", regex: /\b(international applicant|international student|visa|country-specific|outside the United States)\b/i },
    ];
    const findings = categories.map(category => {
      const matches: Array<{ text: string; sourceTitle: string; url: string }> = [];
      for (const source of sources) {
        if (!source.pageText) continue;
        const regex = new RegExp(".{0,180}" + category.regex.source + ".{0,240}", "ig");
        for (const match of source.pageText.matchAll(regex)) {
          const snippet = (match[0] ?? "").trim();
          if (snippet && !matches.some(m => m.text === snippet)) matches.push({ text: snippet, sourceTitle: source.title, url: source.url });
          if (matches.length >= 4) break;
        }
      }
      return { category: category.key, status: matches.length ? "evidence-found" : "not-found", matches };
    });
    return {
      query, researchedAt: new Date().toISOString(),
      status: sources.some(s => s.pageStatus === "read") ? "completed" : "partial",
      message: "Automated public-web scan. Text matches are leads, not verified admissions decisions; open the official pages and confirm the exact rule for your program, citizenship and intake.",
      sources: sources.map(({ pageText, ...source }) => source),
      findings,
    };
  });
