import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Calculator, CircleDollarSign,
  GraduationCap, Plus, RotateCcw, Sparkles, Target, Trash2, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/page-heading";
import { loadStore } from "@/lib/local-store";
import { MAJORS } from "@/lib/assessment-data";

type University = {
  id: string; name: string; country: string; program: string; years: string;
  tuition: string; housing: string; food: string; insurance: string; travel: string; other: string;
  confirmedAid: string; potentialAid: string; source: string; sourceDate: string;
};
type PlannerProfile = {
  homeCountry: string; destination: string; annualBudget: string; degreeYears: string;
  tuitionGrowth: string; livingGrowth: string; major: string;
};
const KEY = "unicompass.financial-decision.v2";
const blankUniversity = (id: string, name: string): University => ({
  id, name, country: "", program: "", years: "4", tuition: "", housing: "", food: "",
  insurance: "", travel: "", other: "", confirmedAid: "", potentialAid: "",
  source: "", sourceDate: "",
});
const initialProfile: PlannerProfile = {
  homeCountry: "Uzbekistan", destination: "United States", annualBudget: "", degreeYears: "4",
  tuitionGrowth: "4", livingGrowth: "3", major: "",
};
const initialUniversities = (): University[] => [
  blankUniversity("u1", "University 1"),
  blankUniversity("u2", "University 2"),
  blankUniversity("u3", "University 3"),
];
const num = (v: string) => Math.max(0, Number(v) || 0);
const money = (v: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
}).format(v);
const pct = (v: number) => `${Math.round(v)}%`;

export const Route = createFileRoute("/cost-planner")({
  head: () => ({ meta: [
    { title: "University Financial Decision Engine — UniCompass" },
    { name: "description", content: "Compare university affordability, scholarship scenarios, and total cost against your budget and academic goals." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: FinancialDecisionEngine,
});

function FinancialDecisionEngine() {
  const [profile, setProfile] = useState<PlannerProfile>(initialProfile);
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [loaded, setLoaded] = useState(false);
  const [savedAcademic, setSavedAcademic] = useState({ gpa: "", sat: "", intendedMajor: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { profile?: PlannerProfile; universities?: University[] };
        if (parsed.profile) setProfile({ ...initialProfile, ...parsed.profile });
        if (Array.isArray(parsed.universities) && parsed.universities.length) {
          setUniversities(parsed.universities.map((u, i) => ({ ...blankUniversity(u.id || String(i), u.name || `University ${i + 1}`), ...u })));
        }
      }
      const store = loadStore();
      setSavedAcademic({
        gpa: store.profile.gpa_unweighted == null ? "" : String(store.profile.gpa_unweighted),
        sat: store.profile.sat_score == null ? "" : String(store.profile.sat_score),
        intendedMajor: store.profile.intended_majors || "",
      });
      if (!profile.major && store.profile.intended_majors) {
        const match = MAJORS.find((m) => store.profile.intended_majors.toLowerCase().includes(m.name.toLowerCase()));
        if (match) setProfile((p) => p.major ? p : ({ ...p, major: match.slug }));
      }
    } catch { /* Keep safe defaults if local data is malformed. */ }
    setLoaded(true);
  // The local profile is intentionally read once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ profile, universities }));
  }, [profile, universities, loaded]);

  const calculations = useMemo(() => universities.map((u) => {
    const tuition = num(u.tuition);
    const housing = num(u.housing);
    const food = num(u.food);
    const insurance = num(u.insurance);
    const travel = num(u.travel);
    const other = num(u.other);
    const gross = tuition + housing + food + insurance + travel + other;
    const confirmedAid = Math.min(num(u.confirmedAid), gross);
    const potentialAid = Math.min(num(u.potentialAid), Math.max(0, gross - confirmedAid));
    const years = Math.max(1, Math.min(8, Math.round(num(u.years) || num(profile.degreeYears) || 4)));
    const tuitionGrowth = num(profile.tuitionGrowth) / 100;
    const livingGrowth = num(profile.livingGrowth) / 100;
    let grossTotal = 0;
    let confirmedTotal = 0;
    let potentialTotal = 0;
    for (let year = 0; year < years; year++) {
      const tuitionYear = tuition * (1 + tuitionGrowth) ** year;
      const livingYear = (housing + food + insurance + travel + other) * (1 + livingGrowth) ** year;
      const totalYear = tuitionYear + livingYear;
      grossTotal += totalYear;
      const confirmedThisYear = Math.min(confirmedAid, totalYear);
      const potentialThisYear = Math.min(potentialAid, Math.max(0, totalYear - confirmedThisYear));
      confirmedTotal += Math.max(0, totalYear - confirmedThisYear);
      potentialTotal += Math.max(0, totalYear - confirmedThisYear - potentialThisYear);
    }
    const budget = num(profile.annualBudget);
    const annualNet = Math.max(0, gross - confirmedAid);
    const potentialAnnualNet = Math.max(0, gross - confirmedAid - potentialAid);
    const budgetGap = budget > 0 ? Math.max(0, annualNet - budget) : null;
    const budgetCoverage = budget > 0 ? Math.min(100, (budget / Math.max(annualNet, 1)) * 100) : null;
    const affordability = budget <= 0 ? "Add budget" : annualNet <= budget ? "Within budget" : potentialAnnualNet <= budget ? "Possible with potential aid" : "Funding gap";
    const complete = Boolean(u.name.trim() && u.country.trim() && u.source.trim() && u.sourceDate.trim() && gross > 0);
    const sourceAgeDays = u.sourceDate ? Math.floor((Date.now() - new Date(u.sourceDate + "T00:00:00").getTime()) / 86400000) : null;
    const sourceFreshness = sourceAgeDays == null || !Number.isFinite(sourceAgeDays) ? "No source date" : sourceAgeDays < 366 && sourceAgeDays >= 0 ? "Recently checked" : "Recheck source";
    return {
      gross, confirmedAid, potentialAid, annualNet, potentialAnnualNet, grossTotal,
      confirmedTotal, potentialTotal, years, budgetGap, budgetCoverage, affordability,
      complete, sourceFreshness,
    };
  }), [universities, profile]);

  const ranked = useMemo(() => universities.map((u, i) => {
    const c = calculations[i];
    const budget = num(profile.annualBudget);
    const affordabilityScore = budget <= 0 ? 0 : c.annualNet <= budget ? 60 : c.potentialAnnualNet <= budget ? 42 : Math.max(0, 42 * budget / Math.max(c.annualNet, 1));
    const dataScore = c.complete ? 20 : (u.source.trim() ? 10 : 0);
    const majorScore = profile.major && u.program.toLowerCase().includes(MAJORS.find((m) => m.slug === profile.major)?.name.toLowerCase() || "__none__") ? 20 : 0;
    const score = Math.round(Math.min(100, affordabilityScore + dataScore + majorScore));
    const tier = score >= 75 ? "Strong financial fit" : score >= 45 ? "Worth investigating" : "High financial risk";
    return { id: u.id, name: u.name || `University ${i + 1}`, score, tier, index: i, ...c };
  }).sort((a, b) => b.score - a.score), [universities, calculations, profile]);

  const updateProfile = (field: keyof PlannerProfile, value: string) => setProfile((p) => ({ ...p, [field]: value }));
  const updateUniversity = (id: string, field: keyof University, value: string) =>
    setUniversities((prev) => prev.map((u) => u.id === id ? { ...u, [field]: value } : u));
  const addUniversity = () => setUniversities((prev) => [...prev, blankUniversity(`u-${Date.now()}`, `University ${prev.length + 1}`)]);
  const reset = () => { setProfile(initialProfile); setUniversities(initialUniversities()); };

  const selectedMajor = MAJORS.find((m) => m.slug === profile.major);
  const completedCount = calculations.filter((c) => c.complete).length;
  const budget = num(profile.annualBudget);
  const cheapest = ranked.filter((r) => r.gross > 0).sort((a, b) => a.confirmedTotal - b.confirmedTotal)[0];

  return <>
    <PageHeading eyebrow="Your money, your options" title="University financial decision engine" description="Build a realistic affordability shortlist using your budget, academic profile, cost assumptions, and scholarship scenarios." />
    <main className="site-width space-y-6 py-8 sm:py-10">
      <section className="tool-panel page-enter">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Target className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Start with your constraints</h2>
            <p className="mt-1 text-sm text-muted-foreground">The engine compares affordability scenarios. It does not invent admission odds or claim scholarships are guaranteed.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-2 size-4" />Reset</Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Home country"><Input value={profile.homeCountry} onChange={(e) => updateProfile("homeCountry", e.target.value)} placeholder="Uzbekistan" /></Field>
          <Field label="Destination country (or region)"><Input value={profile.destination} onChange={(e) => updateProfile("destination", e.target.value)} placeholder="United States" /></Field>
          <Field label="Maximum annual family budget (USD)"><Input type="number" min="0" value={profile.annualBudget} onChange={(e) => updateProfile("annualBudget", e.target.value)} placeholder="e.g. 12000" /></Field>
          <Field label="Intended major"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.major} onChange={(e) => updateProfile("major", e.target.value)}><option value="">Select a major</option>{MAJORS.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}</select></Field>
          <Field label="Expected degree length (years)"><Input type="number" min="1" max="8" value={profile.degreeYears} onChange={(e) => updateProfile("degreeYears", e.target.value)} /></Field>
          <Field label="Assumed annual tuition increase (%)"><Input type="number" min="0" max="20" value={profile.tuitionGrowth} onChange={(e) => updateProfile("tuitionGrowth", e.target.value)} /></Field>
          <Field label="Assumed annual living-cost increase (%)"><Input type="number" min="0" max="20" value={profile.livingGrowth} onChange={(e) => updateProfile("livingGrowth", e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {savedAcademic.gpa && <span className="rounded-full border px-3 py-1">Saved GPA: {savedAcademic.gpa}</span>}
          {savedAcademic.sat && <span className="rounded-full border px-3 py-1">Saved SAT: {savedAcademic.sat}</span>}
          {savedAcademic.intendedMajor && <span className="rounded-full border px-3 py-1">Admissions profile connected</span>}
          {!savedAcademic.gpa && !savedAcademic.sat && !savedAcademic.intendedMajor && <span>Academic profile: not filled in yet. Add it on <Link to="/dashboard" className="underline underline-offset-4">Find Universities</Link>.</span>}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet className="size-4" />} label="Annual budget" value={budget > 0 ? money(budget) : "Not set"} detail="Your affordability ceiling" />
        <Metric icon={<Calculator className="size-4" />} label="Universities compared" value={String(universities.length)} detail={`${completedCount} with sourced cost details`} />
        <Metric icon={<CircleDollarSign className="size-4" />} label="Lowest estimated total" value={cheapest ? money(cheapest.confirmedTotal) : "Add costs"} detail={cheapest ? cheapest.name : "Enter annual expenses"} />
        <Metric icon={<BadgeCheck className="size-4" />} label="Major selected" value={selectedMajor?.name || "Not selected"} detail={selectedMajor ? "Used for shortlist context" : "Select to personalize comparison"} />
      </section>

      {selectedMajor && <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3"><BriefcaseBusiness className="mt-1 size-5 text-primary" /><div><h2 className="font-semibold">Program fit context: {selectedMajor.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedMajor.blurb}</p><div className="mt-3 flex flex-wrap gap-2">{selectedMajor.focusSubjects.slice(0, 4).map((s) => <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs">{s}</span>)}</div></div></div>
        <p className="mt-3 text-xs text-muted-foreground">Use the program field on each university to identify the degree you are actually pricing. This is major context, not a verified program-availability check.</p>
      </section>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Build your university shortlist</h2><p className="mt-1 text-sm text-muted-foreground">Enter annual figures from official university pages. Record the source and date so you know what needs rechecking.</p></div><Button onClick={addUniversity}><Plus className="mr-2 size-4" />Add university</Button></div>
        {universities.map((u, i) => {
          const c = calculations[i];
          const costFields: Array<{ key: keyof University; label: string }> = [
            { key: "tuition", label: "Tuition + mandatory fees" }, { key: "housing", label: "Housing" },
            { key: "food", label: "Meals" }, { key: "insurance", label: "Health insurance" },
            { key: "travel", label: "Flights / local transport" }, { key: "other", label: "Visa, books & other" },
          ];
          return <article key={u.id} className="rounded-xl border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">{i + 1}</span>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                <Field label="University name"><Input value={u.name} onChange={(e) => updateUniversity(u.id, "name", e.target.value)} placeholder="Official institution name" /></Field>
                <Field label="Campus / country"><Input value={u.country} onChange={(e) => updateUniversity(u.id, "country", e.target.value)} placeholder="City, country" /></Field>
                <Field label="Program / degree"><Input value={u.program} onChange={(e) => updateUniversity(u.id, "program", e.target.value)} placeholder={selectedMajor?.name || "Exact degree name"} /></Field>
                <Field label="Years in this program"><Input type="number" min="1" max="8" value={u.years} onChange={(e) => updateUniversity(u.id, "years", e.target.value)} /></Field>
              </div>
              {universities.length > 1 && <Button variant="ghost" size="icon" aria-label={`Remove ${u.name || "university"}`} onClick={() => setUniversities((prev) => prev.filter((x) => x.id !== u.id))}><Trash2 className="size-4" /></Button>}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {costFields.map((f) => <Field key={f.key} label={`${f.label} / year (USD)`}><Input type="number" min="0" step="100" value={u[f.key]} onChange={(e) => updateUniversity(u.id, f.key, e.target.value)} placeholder="0" /></Field>)}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Confirmed annual aid (USD)"><Input type="number" min="0" value={u.confirmedAid} onChange={(e) => updateUniversity(u.id, "confirmedAid", e.target.value)} placeholder="Only awarded / confirmed aid" /></Field>
              <Field label="Potential additional annual aid (USD)"><Input type="number" min="0" value={u.potentialAid} onChange={(e) => updateUniversity(u.id, "potentialAid", e.target.value)} placeholder="Scenario only — not guaranteed" /></Field>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Official cost / aid source URL"><Input value={u.source} onChange={(e) => updateUniversity(u.id, "source", e.target.value)} placeholder="https://university.edu/tuition" /></Field>
              <Field label="Date you checked source"><Input type="date" value={u.sourceDate} onChange={(e) => updateUniversity(u.id, "sourceDate", e.target.value)} /></Field>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ResultMetric label="Annual cost before aid" value={money(c.gross)} />
              <ResultMetric label="Annual net (confirmed aid)" value={money(c.annualNet)} prominent />
              <ResultMetric label="Annual net (if potential aid lands)" value={money(c.potentialAnnualNet)} />
              <ResultMetric label={`Total for ${c.years} years · confirmed aid`} value={money(c.confirmedTotal)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-3 py-1 ${c.affordability === "Within budget" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : c.affordability === "Possible with potential aid" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{c.affordability}</span>
              <span className="text-muted-foreground">{c.budgetGap == null ? "Set a budget to calculate the gap" : c.budgetGap > 0 ? `${money(c.budgetGap)} annual gap after confirmed aid` : "Covered by stated annual budget"}</span>
              <span className="text-muted-foreground">· {c.sourceFreshness}</span>
            </div>
            {u.source && <p className="mt-2 break-all text-xs text-muted-foreground">Source recorded: {u.source}</p>}
          </article>;
        })}
      </section>

      <section className="tool-panel">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-5" /></span><div><h2 className="text-lg font-semibold">Decision shortlist</h2><p className="mt-1 text-sm text-muted-foreground">Ranked by affordability and completeness of your own cost-source notes. This is a planning score—not an admissions probability or university quality ranking.</p></div></div>
        <div className="mt-5 space-y-3">
          {ranked.map((r, order) => <div key={r.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">{order + 1}</span><div><p className="font-medium">{r.name}</p><p className="mt-1 text-xs text-muted-foreground">{r.tier} · {r.affordability}</p></div></div>
              <div className="text-right"><p className="text-xl font-semibold">{r.score}<span className="text-xs font-normal text-muted-foreground">/100</span></p><p className="text-xs text-muted-foreground">Planning score</p></div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${r.score}%` }} /></div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Net total:</span> {money(r.confirmedTotal)}</p><p><span className="text-muted-foreground">With potential aid:</span> {money(r.potentialTotal)}</p><p><span className="text-muted-foreground">Cost data:</span> {r.complete ? "Source + date recorded" : "Needs verification"}</p></div>
          </div>)}
        </div>
        <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">A source URL and date are recorded by you; UniCompass has not independently verified those pages. Potential aid is a what-if scenario, not an award. Cost growth is an assumption, and real tuition or living costs can change differently.</div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Next actions</h2>
        <div className="mt-3 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/dashboard"><GraduationCap className="mr-2 size-4" />Complete admissions profile</Link></Button><Button asChild variant="outline"><Link to="/find-your-major"><Target className="mr-2 size-4" />Take major assessment</Link></Button><Button asChild><Link to="/career-explorer">Explore career paths<ArrowRight className="ml-2 size-4" /></Link></Button></div>
      </section>
      <p className="text-xs text-muted-foreground">Your planner is saved in this browser. It does not yet pull live university prices, exchange rates, or scholarship listings. All amounts are modeled in USD; verify current costs and aid terms with the institution.</p>
      <Button asChild variant="ghost"><Link to="/dashboard"><ArrowLeft className="mr-2 size-4" />Back to admissions</Link></Button>
    </main>
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0 space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div><p className="mt-3 break-words text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
function ResultMetric({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) {
  return <div className={`rounded-lg p-3 ${prominent ? "bg-primary/10" : "bg-muted/60"}`}><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 break-words text-lg font-semibold ${prominent ? "text-primary" : ""}`}>{value}</p></div>;
}
