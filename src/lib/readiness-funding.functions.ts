import { createServerFn } from "@tanstack/react-start";

type FundingInput = { university: string; program: string; degree: string; intake: string; citizenship: string; budget: number; budgetPeriod: string; scholarshipTypes: string[] };

export const researchUniversityFunding = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): FundingInput => {
    const d = raw as Partial<FundingInput>;
    if (!d || typeof d.university !== "string" || d.university.trim().length < 2) throw new Error("Enter a university name.");
    return {
      university: d.university.trim().slice(0, 160),
      program: typeof d.program === "string" ? d.program.trim().slice(0, 160) : "",
      degree: typeof d.degree === "string" ? d.degree.slice(0, 40) : "Undergraduate",
      intake: typeof d.intake === "string" ? d.intake.slice(0, 60) : "",
      citizenship: typeof d.citizenship === "string" ? d.citizenship.slice(0, 80) : "",
      budget: Number.isFinite(d.budget) ? Math.max(0, Number(d.budget)) : 10000,
      budgetPeriod: d.budgetPeriod === "degree" ? "degree" : "year",
      scholarshipTypes: Array.isArray(d.scholarshipTypes) ? d.scholarshipTypes.filter(x => x === "need" || x === "merit") : ["need", "merit"],
    };
  })
  .handler(async ({ data }) => {
    const key = process.env.TAVILY_API_KEY?.trim();
    if (!key) return { status: "unavailable", researchedAt: new Date().toISOString(), message: "Search is not configured on the server.", sources: [], costs: [], scholarships: [] };
    const base = '"' + data.university + '" ' + data.program + " " + data.degree + " international student";
    const queries = [
      base + " official tuition fees cost of attendance living expenses mandatory fees",
      base + " official scholarships international undergraduate students",
      base + " official financial aid need based scholarships international students eligibility deadline",
      base + " official merit scholarships international students deadline award amount",
    ];
    const searches = await Promise.all(queries.map(async (query) => {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: key, query, search_depth: "advanced", max_results: 10, include_answer: false, include_raw_content: false }),
          signal: AbortSignal.timeout(18000),
        });
        if (!response.ok) return { query, error: "Search provider HTTP " + response.status, results: [] as Array<{title:string;url:string;content:string}> };
        const payload = await response.json() as { results?: Array<{title?:string;url?:string;content?:string}> };
        return { query, error: "", results: (payload.results ?? []).filter(x => x.title && x.url).map(x => ({ title: x.title!, url: x.url!, content: x.content ?? "" })) };
      } catch (e) { return { query, error: e instanceof Error ? e.message : "Search failed", results: [] as Array<{title:string;url:string;content:string}> }; }
    }));
    const seen = new Set<string>();
    const sources = searches.flatMap(s => s.results).filter(x => {
      try {
        const u = new URL(x.url); const host = u.hostname.toLowerCase();
        if (!["https:", "http:"].includes(u.protocol) || /google\.|bing\.|duckduckgo|facebook|instagram|reddit|youtube/.test(host)) return false;
        const nameTerms = data.university.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && !["university","college","institute","technology"].includes(w));
        if (!nameTerms.some(w => (host + " " + x.title).includes(w))) return false;
        if (seen.has(x.url)) return false; seen.add(x.url); return true;
      } catch { return false; }
    }).slice(0, 30).map(x => {
      const category = /scholarship|financial aid|fellowship|grant|award/i.test(x.title + " " + x.content) ? "scholarship" : /tuition|fee|cost of attendance|living expenses|housing/i.test(x.title + " " + x.content) ? "cost" : "admissions/funding";
      return { ...x, category, snippet: x.content.slice(0, 1000) };
    });
    const scholarshipResults = sources.filter(s => s.category === "scholarship");
    const costResults = sources.filter(s => s.category === "cost");
    return {
      status: sources.length ? "completed" : "no-results",
      researchedAt: new Date().toISOString(),
      message: sources.length ? "Search results are candidates, not verified awards. Open the official page and confirm international eligibility, intake, deadline and award conditions. Results may not enumerate every scholarship." : "No matching university-domain pages were returned. No cost or scholarship values have been assumed.",
      budget: data.budget, budgetPeriod: data.budgetPeriod, scholarshipTypes: data.scholarshipTypes,
      providerErrors: searches.map(s => s.error).filter(Boolean),
      sources, costs: costResults, scholarships: scholarshipResults,
    };
  });
