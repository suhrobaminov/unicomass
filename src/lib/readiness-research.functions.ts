import { createServerFn } from "@tanstack/react-start";
import { geminiChat } from "@/lib/gemini.server";

type ResearchInput = {
  university: string;
  program: string;
  degree: string;
  intake: string;
  citizenship: string;
  student: { gpa: string; gradingScale: string; englishTest: string; englishScore: string; sat: string; act: string; subjects: string; awards: string; projects: string; research: string; activities: string; volunteering: string; portfolio: string; budget: string };
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
      student: (() => {
        const p = d.student && typeof d.student === "object" ? d.student : {} as ResearchInput["student"];
        const clean = (v: unknown, max = 1200) => typeof v === "string" ? v.trim().slice(0, max) : "";
        return {
          gpa: clean(p.gpa, 80), gradingScale: clean(p.gradingScale, 100),
          englishTest: clean(p.englishTest, 80), englishScore: clean(p.englishScore, 40),
          sat: clean(p.sat, 20), act: clean(p.act, 20), subjects: clean(p.subjects),
          awards: clean(p.awards), projects: clean(p.projects), research: clean(p.research),
          activities: clean(p.activities), volunteering: clean(p.volunteering), portfolio: clean(p.portfolio),
          budget: clean(p.budget, 40),
        };
      })(),
    };
  })
  .handler(async ({ data }) => {
    const query = [
      '"' + data.university + '"',
      data.program,
      data.degree,
      data.intake,
      data.citizenship ? data.citizenship + " international applicant" : "international applicant",
      "admission requirements official university",
    ].filter(Boolean).join(" ");
    const universityTerms = data.university.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
      .filter(word => word.length > 2 && !["the", "and", "university", "college", "institute", "of", "at"].includes(word));
    const isRelevantResult = (item: { title: string; url: string; snippet: string }) => {
      try {
        const parsed = new URL(item.url);
        const titleAndHost = (item.title + " " + parsed.hostname).toLowerCase();
        const allText = (titleAndHost + " " + item.snippet).toLowerCase();
        if (!universityTerms.length) return false;
        const strongMatches = universityTerms.filter(word => titleAndHost.includes(word)).length;
        const anyMatches = universityTerms.filter(word => allText.includes(word)).length;
        return strongMatches >= 1 && anyMatches >= Math.min(2, universityTerms.length);
      } catch { return false; }
    };
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const providers = [
      {
        name: "DuckDuckGo",
        url: "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query),
        parse: (html: string) => {
          const found: Array<{ title: string; url: string; snippet: string }> = [];
          const blocks = html.match(/<div class="result[^"]*"[^]*?(?=<div class="result[^"]*"|$)/gi) ?? [];
          for (const block of blocks) {
            const link = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^]*?)<\/a>/i);
            if (!link) continue;
            let url = decode(link[1]);
            try {
              const parsed = new URL(url, "https://html.duckduckgo.com");
              if (parsed.hostname.includes("duckduckgo.com") && parsed.searchParams.has("uddg")) url = parsed.searchParams.get("uddg")!;
            } catch { continue; }
            const snippet = block.match(/<(?:a|div)[^>]+class="result__snippet"[^>]*>([^]*?)<\/(?:a|div)>/i);
            found.push({ title: stripHtml(link[2]).slice(0, 180), url, snippet: stripHtml(snippet?.[1] ?? "").slice(0, 500) });
          }
          return found;
        },
      },
      {
        name: "Bing RSS",
        url: "https://www.bing.com/search?format=rss&q=" + encodeURIComponent(query),
        parse: (xml: string) => {
          const found: Array<{ title: string; url: string; snippet: string }> = [];
          for (const item of xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []) {
            const title = item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
            const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "";
            const description = item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "";
            const url = decode(link.replace(/<!\[CDATA\[|\]\]>/g, "").trim());
            if (url) found.push({ title: stripHtml(title).slice(0, 180), url, snippet: stripHtml(description).slice(0, 500) });
          }
          return found;
        },
      },
    ];
    const providerErrors: string[] = [];
    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
    if (tavilyKey) {
      try {
        const tavilyResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: "basic",
            max_results: 10,
            include_answer: false,
            include_raw_content: false,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!tavilyResponse.ok) {
          providerErrors.push("Tavily Search API HTTP " + tavilyResponse.status);
        } else {
          const payload = await tavilyResponse.json() as {
            results?: Array<{ title?: string; url?: string; content?: string }>;
          };
          for (const item of payload.results ?? []) {
            if (!item.title || !item.url) continue;
            const normalized = { title: item.title, url: item.url, snippet: item.content ?? "" };
            if (!isOfficialish(normalized.url, data.university) || !isRelevantResult(normalized)) continue;
            if (!results.some(existing => existing.url === normalized.url)) results.push(normalized);
            if (results.length >= 8) break;
          }
          if (!results.length) providerErrors.push("Tavily returned no matching official pages");
        }
      } catch (error) {
        providerErrors.push("Tavily Search API: " + (error instanceof Error ? error.message : "request failed"));
      }
    } else {
      providerErrors.push("Tavily API key is not configured");
    }
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    if (braveKey) {
      try {
        const braveResponse = await fetch("https://api.search.brave.com/res/v1/web/search?" + new URLSearchParams({
          q: query,
          count: "20",
          search_lang: "en",
        }), {
          headers: { Accept: "application/json", "X-Subscription-Token": braveKey },
          signal: AbortSignal.timeout(12000),
        });
        if (!braveResponse.ok) {
          providerErrors.push("Brave Search API HTTP " + braveResponse.status);
        } else {
          const payload = await braveResponse.json() as {
            web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
          };
          for (const item of payload.web?.results ?? []) {
            if (!item.title || !item.url) continue;
            const normalized = { title: item.title, url: item.url, snippet: item.description ?? "" };
            if (!isOfficialish(normalized.url, data.university) || !isRelevantResult(normalized)) continue;
            if (!results.some(existing => existing.url === normalized.url)) results.push(normalized);
            if (results.length >= 8) break;
          }
          if (!results.length) providerErrors.push("Brave Search returned no matching official pages");
        }
      } catch (error) {
        providerErrors.push("Brave Search API: " + (error instanceof Error ? error.message : "request failed"));
      }
    } else {
      providerErrors.push("Brave Search API key is not configured");
    }
    if (!results.length) for (const provider of providers) {
      try {
        const response = await fetch(provider.url, {
          headers: { "user-agent": "Mozilla/5.0 (compatible; UniCompassAdmissionsResearch/1.0)", accept: provider.name === "Bing RSS" ? "application/rss+xml, application/xml, text/xml" : "text/html" },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          providerErrors.push(provider.name + " HTTP " + response.status);
          continue;
        }
        const parsed = provider.parse(await response.text());
        for (const item of parsed) {
          if (!isOfficialish(item.url, data.university) || !isRelevantResult(item)) continue;
          if (!results.some(existing => existing.url === item.url)) results.push(item);
          if (results.length >= 8) break;
        }
        if (results.length) break;
        providerErrors.push(provider.name + " returned no matching official pages");
      } catch (error) {
        providerErrors.push(provider.name + ": " + (error instanceof Error ? error.message : "request failed"));
      }
    }
    if (!results.length) {
      const searchQuery = [data.university, data.program, data.degree, data.intake, "admission requirements official site"].filter(Boolean).join(" ");
      const encoded = encodeURIComponent(searchQuery);
      return {
        query, researchedAt: new Date().toISOString(), status: "no-results",
        message: "Automatic retrieval is blocked or unavailable (" + providerErrors.join("; ") + "). These links open live search results so you can reach the university's official pages. No requirements have been guessed.",
        sources: [
          { title: "Search Google for official admissions pages", url: "https://www.google.com/search?q=" + encoded, snippet: "Search results for " + searchQuery, pageStatus: "search-link" },
          { title: "Search Bing for official admissions pages", url: "https://www.bing.com/search?q=" + encoded, snippet: "Alternative search results for " + searchQuery, pageStatus: "search-link" },
          { title: "Search the university domain for admissions", url: "https://www.google.com/search?q=" + encodeURIComponent("\"" + data.university + "\" official admissions " + data.program), snippet: "Searches the exact university name and program. Confirm the result domain belongs to the university.", pageStatus: "search-link" },
        ],
        findings: [],
      };
    }
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
    const readableSources = sources.filter(source => source.pageText.length > 100);
    let assessment: Record<string, unknown> | null = null;
    let assessmentError = "";
    if (readableSources.length && (data.student.gpa || data.student.englishScore || data.student.sat || data.student.act)) {
      const evidence = readableSources.map(source => ({ title: source.title, url: source.url, text: source.pageText.slice(0, 9000) }));
      try {
        const raw = await geminiChat({
          jsonMode: true,
          temperature: 0.1,
          messages: [
            { role: "system", content: "You are a conservative university admissions analyst. Compare the supplied student profile ONLY with requirements and admissions benchmarks explicitly present in the supplied university page extracts. Do not use prior knowledge to invent school-specific thresholds, admitted-student ranges, acceptance rates, scholarships, or program facts. Distinguish minimum eligibility from competitiveness. For missing evidence, say unknown. Do not infer admission probability or guarantee admission. Return one JSON object with: category (SAFE|TARGET|REACH|INSUFFICIENT_DATA), confidence (low|medium|high), headline, overall_reason (3-5 sentences), requirement_comparisons (array of {requirement, university_evidence, student_value, assessment (meets|below|above|unknown), explanation, source_url}), strengths (string array), gaps (string array), next_steps (string array), data_limitations (string array). SAFE means strong evidence-based academic alignment and no known major eligibility gaps, not guaranteed admission. TARGET means mixed/competitive alignment. REACH means material gaps against published requirements or credible benchmarks. If sources do not give meaningful academic benchmarks or student profile is incomplete, use INSUFFICIENT_DATA. Cite each comparison to a supplied source URL by including source_url. Do not claim evidence not present in extracts." },
            { role: "user", content: JSON.stringify({ university: data.university, program: data.program, degree: data.degree, intake: data.intake, citizenship: data.citizenship, student: data.student, official_page_extracts: evidence }) },
          ],
        });
        const cleaned = raw.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "").trim();
        const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
        const parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as Record<string, unknown>;
        if (!["SAFE", "TARGET", "REACH", "INSUFFICIENT_DATA"].includes(String(parsed.category)) || !Array.isArray(parsed.requirement_comparisons)) throw new Error("AI assessment response did not match the required schema.");
        const allowedSourceUrls = new Set(readableSources.map(source => source.url));
        const comparisons = (parsed.requirement_comparisons as Array<Record<string, unknown>>).slice(0, 20).map(item => ({
          ...item,
          source_url: typeof item.source_url === "string" && allowedSourceUrls.has(item.source_url) ? item.source_url : "",
        }));
        assessment = { ...parsed, requirement_comparisons: comparisons };
      } catch (error) {
        assessmentError = error instanceof Error ? error.message : "AI assessment unavailable";
      }
    }
    return {
      query, researchedAt: new Date().toISOString(),
      assessment,
      assessmentError,
      status: sources.some(s => s.pageStatus === "read") ? "completed" : "partial",
      message: "Automated public-web scan. Text matches are leads, not verified admissions decisions; open the official pages and confirm the exact rule for your program, citizenship and intake.",
      sources: sources.map(({ pageText, ...source }) => source),
      findings,
    };
  });
