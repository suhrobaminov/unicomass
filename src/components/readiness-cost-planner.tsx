import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, ExternalLink, LoaderCircle, CircleHelp, Wallet, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { researchUniversityFunding } from "@/lib/readiness-funding.functions";

type Source = { title: string; url: string; category: string; snippet: string };
type Result = { status: string; researchedAt: string; message: string; sources: Source[]; costs: Source[]; scholarships: Source[]; providerErrors?: string[] };
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function ReadinessCostPlanner({ degree, citizenship, enrollment }: { degree: string; citizenship: string; enrollment: string }) {
  const runResearch = useServerFn(researchUniversityFunding);
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [budget, setBudget] = useState("10000");
  const [period, setPeriod] = useState("year");
  const [level, setLevel] = useState("Undergraduate");
  const [types, setTypes] = useState<string[]>(["need", "merit"]);
  const [intake, setIntake] = useState(enrollment || "Fall 2027");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!university.trim()) { setError("Enter the university name first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await runResearch({ data: { university, program, degree: level || degree, intake, citizenship, budget: Number(budget) || 0, budgetPeriod: period, scholarshipTypes: types } }) as Result;
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Funding research failed."); }
    finally { setLoading(false); }
  };
  const toggleType = (type: string) => setTypes(p => p.includes(type) ? p.filter(x => x !== type) : [...p, type]);
  const renderSources = (items: Source[], empty: string) => items.length ? <div className="space-y-3">{items.map((s, i) => <article key={s.url + i} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs uppercase tracking-wide text-muted-foreground">{s.category === "scholarship" ? "Scholarship / aid lead" : s.category === "cost" ? "Cost evidence lead" : "Funding / admissions lead"}</span><a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4">Official/source page <ExternalLink className="size-3" /></a></div><h4 className="mt-1 font-medium">{s.title}</h4>{s.snippet && <p className="mt-1 text-sm text-muted-foreground">{s.snippet}</p>}</article>)}</div> : <p className="text-sm text-muted-foreground">{empty}</p>;
  return <section className="tool-panel space-y-4">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Integrated affordability research</p><h2 className="mt-1 text-xl font-semibold">University cost & scholarship planner</h2><p className="mt-1 text-sm text-muted-foreground">Searches the university's public web footprint for tuition, living costs, mandatory fees, and its need-based and merit-based scholarship opportunities. Results are source leads, not guarantees that every award was found.</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1.5 text-sm font-medium">University name<Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. University of Toronto" /></label>
      <label className="space-y-1.5 text-sm font-medium">Program / major<Input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Computer Science" /></label>
      <label className="space-y-1.5 text-sm font-medium">Maximum budget (USD)<Input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)} /></label>
      <label className="space-y-1.5 text-sm font-medium">Budget period<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={period} onChange={e => setPeriod(e.target.value)}><option value="year">Per year</option><option value="degree">Entire degree</option></select></label>
      <label className="space-y-1.5 text-sm font-medium">Study level<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={level} onChange={e => setLevel(e.target.value)}><option>Undergraduate</option><option>Graduate</option><option>Doctoral</option></select></label>
      <label className="space-y-1.5 text-sm font-medium">Intended intake<Input value={intake} onChange={e => setIntake(e.target.value)} placeholder="Fall 2027" /></label>
    </div>
    <fieldset className="space-y-2"><legend className="text-sm font-medium">Scholarship types to search</legend><div className="flex flex-wrap gap-4 text-sm">{[["need","Need-based"],["merit","Merit-based"]].map(([v,label]) => <label key={v} className="flex items-center gap-2"><input type="checkbox" checked={types.includes(v)} onChange={() => toggleType(v)} />{label}</label>)}</div><p className="text-xs text-muted-foreground">Citizenship used for eligibility matching: {citizenship || "not specified"}. Change it in the student profile above.</p></fieldset>
    <Button onClick={search} disabled={loading || !university.trim()}>{loading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Searching costs and scholarships…</> : <><Search className="mr-2 size-4" />Search this university's funding</>}</Button>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm">{error}</p>}
    {result && <div className="space-y-4">
      <div className="rounded-lg border p-3 text-sm"><p className="font-medium">{result.status === "completed" ? "Research results found" : result.status === "unavailable" ? "Search unavailable" : "No matching pages found"}</p><p className="mt-1 text-muted-foreground">{result.message}</p><p className="mt-1 text-xs text-muted-foreground">Checked {new Date(result.researchedAt).toLocaleString()} · {result.sources.length} candidate page(s)</p>{result.providerErrors?.length ? <p className="mt-2 text-xs text-muted-foreground">Some searches failed: {result.providerErrors.join("; ")}</p> : null}</div>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm"><CircleHelp className="mr-1 inline size-4" />Net cost and funding gap are not calculated from search snippets alone: no tuition, living-cost, fee, or scholarship amount is treated as verified until an explicit figure and applicable period are confirmed. Potential scholarships are not deducted as awarded funding.</div>
      <div><h3 className="mb-2 flex items-center gap-2 font-semibold"><Wallet className="size-4" />Tuition, living costs & mandatory fees</h3>{renderSources(result.costs, "No cost pages were found. Costs remain unknown; open official tuition and cost-of-attendance pages.")}</div>
      <div><h3 className="mb-2 flex items-center gap-2 font-semibold"><GraduationCap className="size-4" />University scholarships and financial aid</h3>{renderSources(result.scholarships.filter(s => types.some(t => t === "need" ? /need|financial aid|grant/i.test(s.title + " " + s.snippet) : /merit|academic|scholarship|award/i.test(s.title + " " + s.snippet))), "No scholarship pages were found. Eligibility, award values and deadlines are unknown.")}</div>
      <div><h3 className="mb-2 font-semibold">All matching university funding pages</h3>{renderSources(result.sources, "No matching source pages.")}</div>
      <p className="text-xs text-muted-foreground">A search cannot guarantee an exhaustive list of every scholarship. Confirm international-student eligibility, citizenship restrictions, award amount, renewable conditions, application route, and deadline on each linked official page. Admission eligibility, admission competitiveness, and affordability are assessed separately; this search does not estimate admission odds.</p>
    </div>}
  </section>;
}
