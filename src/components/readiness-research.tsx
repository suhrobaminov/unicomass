import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, ExternalLink, LoaderCircle, AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { researchUniversityRequirements } from "@/lib/readiness-research.functions";

type Props = { degree: string; citizenship: string; enrollment: string };
type ResearchResult = {
  status: string; message: string; researchedAt: string;
  sources: Array<{ title: string; url: string; snippet: string; pageStatus: string }>;
  findings: Array<{ category: string; status: string; matches: Array<{ text: string; sourceTitle: string; url: string }> }>;
};

export function ReadinessResearch({ degree, citizenship, enrollment }: Props) {
  const runResearch = useServerFn(researchUniversityRequirements);
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [intake, setIntake] = useState(enrollment || "Fall 2027");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!university.trim()) { setError("Enter a university name first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await runResearch({ data: { university, program, degree, intake, citizenship } }) as ResearchResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed. The search provider may be unavailable or blocking requests.");
    } finally { setLoading(false); }
  };

  return <section className="tool-panel space-y-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Automatic research · no Gemini API</p>
      <h2 className="mt-1 text-xl font-semibold">Find official requirements</h2>
      <p className="mt-1 text-sm text-muted-foreground">Searches the public web, prioritizes likely official university domains, fetches accessible pages, and surfaces evidence for common admission rules. It does not invent missing values.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 text-sm font-medium">University<Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. University of Toronto" /></label>
      <label className="space-y-1.5 text-sm font-medium">Program / major<Input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Computer Science" /></label>
      <label className="space-y-1.5 text-sm font-medium">Intended intake<Input value={intake} onChange={e => setIntake(e.target.value)} placeholder="Fall 2027" /></label>
      <div className="flex items-end"><Button onClick={search} disabled={loading} className="w-full sm:w-auto">{loading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Researching pages…</> : <><Search className="mr-2 size-4" />Research university</>}</Button></div>
    </div>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{error}</div>}
    {result && <>
      <div className="rounded-lg border p-3 text-sm"><p className="font-medium">{result.status === "completed" ? "Scan completed" : result.status === "partial" ? "Partial scan" : "No official pages found"}</p><p className="mt-1 text-muted-foreground">{result.message}</p><p className="mt-1 text-xs text-muted-foreground">Scanned {result.sources.length} candidate source(s) · {new Date(result.researchedAt).toLocaleString()}</p></div>
      {result.findings?.length > 0 && <div className="space-y-3"><h3 className="font-semibold">Evidence found</h3>{result.findings.map(item => <div key={item.category} className="rounded-lg border p-3">
        <div className="flex items-center gap-2 font-medium">{item.status === "evidence-found" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <CircleHelp className="size-4 text-muted-foreground" />}{item.category}<span className="ml-auto text-xs font-normal text-muted-foreground">{item.status === "evidence-found" ? "Evidence found — verify" : "Not found"}</span></div>
        {item.matches.map((match, i) => <div key={i} className="mt-2 border-l-2 pl-3 text-sm"><p>{match.text}</p><a href={match.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary underline underline-offset-4">{match.sourceTitle || "Open source"} <ExternalLink className="size-3" /></a></div>)}
      </div>)}</div>}
      <div className="space-y-2"><h3 className="font-semibold">{result.status === "no-results" ? "Search links to continue manually" : "Candidate official pages"}</h3>{result.sources.map((source, i) => <div key={source.url + i} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">{source.title || source.url} <ExternalLink className="inline size-3" /></a><span className="text-xs text-muted-foreground">{source.pageStatus === "search-link" ? "Open search" : source.pageStatus === "read" ? "Page read" : source.pageStatus === "blocked" ? "Blocked" : source.pageStatus === "not-html" ? "Not HTML" : "Could not parse"}</span></div>{source.snippet && <p className="mt-1 text-sm text-muted-foreground">{source.snippet}</p>}</div>)}</div>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0" />This lightweight extractor is a research aid, not a guarantee of accuracy or a substitute for the university's current admissions page. A missing result means “not found,” not “not required.”</p>
    </>}
  </section>;
}
