import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpenCheck, ExternalLink, LoaderCircle, Plus, SearchCheck, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeading } from "@/components/page-heading";
import { researchUniversityFunding } from "@/lib/funding-research.functions";

type UniversityInput = { id: string; name: string; url: string };
type Student = {
  homeCountry: string; degreeLevel: string; intendedMajor: string; graduationYear: string;
  gpa: string; sat: string; act: string; englishTest: string; englishScore: string;
  annualBudget: string; financialNeed: string; citizenship: string; notes: string;
};
const initialStudent: Student = {
  homeCountry: "Uzbekistan", degreeLevel: "Bachelor's", intendedMajor: "", graduationYear: "",
  gpa: "", sat: "", act: "", englishTest: "IELTS", englishScore: "",
  annualBudget: "", financialNeed: "Need-based and merit aid", citizenship: "Uzbekistan", notes: "",
};
const blankUniversity = (id: string): UniversityInput => ({ id, name: "", url: "" });
const emptyReport = null;

export const Route = createFileRoute("/funding-research")({
  head: () => ({ meta: [
    { title: "AI Scholarship & Tuition Research — UniCompass" },
    { name: "description", content: "Research official university tuition, scholarships, eligibility criteria, and deadlines against your student profile." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: FundingResearchPage,
});

function FundingResearchPage() {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [universities, setUniversities] = useState<UniversityInput[]>([
    { id: "uni-1", name: "", url: "" }, { id: "uni-2", name: "", url: "" }, { id: "uni-3", name: "", url: "" },
  ]);
  const [report, setReport] = useState<Record<string, unknown> | null>(emptyReport);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const research = useServerFn(researchUniversityFunding);

  const setField = (field: keyof Student, value: string) => setStudent((p) => ({ ...p, [field]: value }));
  const setUniversity = (id: string, field: keyof UniversityInput, value: string) =>
    setUniversities((prev) => prev.map((u) => u.id === id ? { ...u, [field]: value } : u));

  async function runResearch() {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const result = await research({ data: { student, universities: universities.filter((u) => u.name.trim()) } });
      setReport(result as unknown as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const findings = Array.isArray(report?.findings) ? report.findings as Array<Record<string, unknown>> : [];
  const groundedSources = Array.isArray(report?.groundedSources) ? report.groundedSources as Array<{ url: string; title: string }> : [];

  return <>
    <PageHeading eyebrow="Evidence-first AI research" title="Scholarship & tuition researcher" description="Give UniCompass your profile and university targets. AI searches for official tuition and funding information and screens published eligibility criteria." />
    <main className="site-width space-y-6 py-8 sm:py-10">
      <section className="tool-panel">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><BookOpenCheck className="size-5" /></span>
          <div><h2 className="text-lg font-semibold">Your student profile</h2><p className="mt-1 text-sm text-muted-foreground">More relevant details lead to better screening. Leave unknown scores blank; do not guess.</p></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Home country"><Input value={student.homeCountry} onChange={(e) => setField("homeCountry", e.target.value)} /></Field>
          <Field label="Citizenship"><Input value={student.citizenship} onChange={(e) => setField("citizenship", e.target.value)} /></Field>
          <Field label="Degree level"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={student.degreeLevel} onChange={(e) => setField("degreeLevel", e.target.value)}><option>Bachelor's</option><option>Master's</option><option>PhD</option><option>Associate</option><option>Other</option></select></Field>
          <Field label="Intended major"><Input value={student.intendedMajor} onChange={(e) => setField("intendedMajor", e.target.value)} placeholder="Computer Science" /></Field>
          <Field label="Expected enrollment year"><Input value={student.graduationYear} onChange={(e) => setField("graduationYear", e.target.value)} placeholder="2027" /></Field>
          <Field label="Maximum annual family budget (USD)"><Input type="number" min="0" value={student.annualBudget} onChange={(e) => setField("annualBudget", e.target.value)} placeholder="e.g. 12000" /></Field>
          <Field label="GPA / grading scale"><Input value={student.gpa} onChange={(e) => setField("gpa", e.target.value)} placeholder="e.g. 3.8/4.0 or 90/100" /></Field>
          <Field label="SAT score"><Input type="number" value={student.sat} onChange={(e) => setField("sat", e.target.value)} placeholder="Optional" /></Field>
          <Field label="ACT score"><Input type="number" value={student.act} onChange={(e) => setField("act", e.target.value)} placeholder="Optional" /></Field>
          <Field label="English test"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={student.englishTest} onChange={(e) => setField("englishTest", e.target.value)}><option>IELTS</option><option>TOEFL</option><option>Duolingo English Test</option><option>Other</option><option>Not taken</option></select></Field>
          <Field label="English test score"><Input value={student.englishScore} onChange={(e) => setField("englishScore", e.target.value)} placeholder="e.g. IELTS 7.0" /></Field>
          <Field label="Funding need"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={student.financialNeed} onChange={(e) => setField("financialNeed", e.target.value)}><option>Need-based and merit aid</option><option>Merit scholarships</option><option>Need-based aid</option><option>Full funding required</option><option>Any available aid</option></select></Field>
        </div>
        <div className="mt-4"><Field label="Other details that may affect eligibility (optional)"><Textarea rows={3} value={student.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Awards, olympiads, extracurricular impact, intended intake term, special eligibility details..." /></Field></div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Universities to research</h2><p className="mt-1 text-sm text-muted-foreground">Add up to five institutions. Official tuition, international admissions, and scholarship URLs help narrow the search.</p></div>{universities.length < 5 && <Button variant="outline" onClick={() => setUniversities((p) => [...p, blankUniversity(`uni-${Date.now()}`)])}><Plus className="mr-2 size-4" />Add university</Button>}</div>
        {universities.map((u, i) => <section key={u.id} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`University ${i + 1} name`}><Input value={u.name} onChange={(e) => setUniversity(u.id, "name", e.target.value)} placeholder="e.g. University of Toronto" /></Field>
            <Field label="Official website URL (optional)"><Input value={u.url} onChange={(e) => setUniversity(u.id, "url", e.target.value)} placeholder="https://www.university.edu/financial-aid" /></Field>
          </div>
          {universities.length > 1 && <div className="mt-3 flex justify-end"><Button variant="ghost" size="sm" onClick={() => setUniversities((p) => p.filter((x) => x.id !== u.id))}><Trash2 className="mr-2 size-4" />Remove</Button></div>}
        </section>)}
      </section>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground"><ShieldAlert className="mr-2 inline size-4" />AI can make mistakes. This tool provides preliminary research, not financial, admissions, or legal advice. It searches public web sources, prioritizes official university pages, and may miss content behind logins or sites that block automated access. Verify each result directly with the university before making decisions.</div>
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      <Button size="lg" disabled={loading || !universities.some((u) => u.name.trim())} onClick={runResearch} className="w-full sm:w-auto">{loading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Researching official sources…</> : <><SearchCheck className="mr-2 size-4" />Research tuition & scholarships<ArrowRight className="ml-2 size-4" /></>}</Button>

      {loading && <section className="tool-panel" role="status" aria-live="polite"><div className="flex items-center gap-3"><LoaderCircle className="size-5 animate-spin text-primary" /><div><h2 className="font-semibold">Research in progress</h2><p className="mt-1 text-sm text-muted-foreground">Searching for tuition, aid rules, eligibility criteria, and deadlines. Results can take a little time.</p></div></div></section>}
      {report && <section className="space-y-4" aria-live="polite">
        <div className="tool-panel"><h2 className="text-xl font-semibold">Research report</h2><p className="mt-2 text-sm text-muted-foreground">{String(report.overallNote || "Review findings and verify each source.")}</p><p className="mt-2 text-xs text-muted-foreground">Generated: {String(report.generatedAt || "")}</p></div>
        {findings.length === 0 && <div className="rounded-xl border bg-card p-5 text-sm">{String(report.overallNote || "No structured findings were returned. Try again or supply more specific university names.")}</div>}
        {findings.map((f, i) => <FindingCard key={`${String(f.university)}-${i}`} finding={f} />)}
        {groundedSources.length > 0 && <section className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Additional web sources returned by search</h3><ul className="mt-3 space-y-2">{groundedSources.map((s, i) => <li key={`${s.url}-${i}`} className="text-sm"><a className="break-all text-primary underline underline-offset-4" href={s.url} target="_blank" rel="noreferrer">{s.title || s.url} <ExternalLink className="inline size-3" /></a></li>)}</ul></section>}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">{String(report.disclaimer || "AI can make mistakes. Independently verify all claims.")}</div>
      </section>}
    </main>
  </>;
}

function FindingCard({ finding }: { finding: Record<string, unknown> }) {
  const tuition = finding.tuition && typeof finding.tuition === "object" ? finding.tuition as Record<string, unknown> : {};
  const scholarships = Array.isArray(finding.scholarships) ? finding.scholarships as Array<Record<string, unknown>> : [];
  const sources = Array.isArray(finding.sources) ? finding.sources as Array<Record<string, unknown>> : [];
  const strings = (v: unknown) => Array.isArray(v) ? v.map(String) : [];
  return <article className="rounded-xl border bg-card p-5 shadow-soft space-y-4">
    <div><h3 className="text-lg font-semibold">{String(finding.university || "University research")}</h3><p className="mt-1 text-sm text-muted-foreground">Confidence: {String(finding.confidence || "not stated")} · verify independently</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Tuition found</p><p className="mt-1 font-semibold">{String(tuition.amount || "Not found")}</p><p className="mt-1 text-xs text-muted-foreground">{String(tuition.period || "")} {String(tuition.studentCategory || "")}</p></div>
      <div className="rounded-lg bg-primary/10 p-4"><p className="text-xs text-muted-foreground">Estimated net cost</p><p className="mt-1 font-semibold">{String(finding.estimatedNetCost || "Insufficient verified data")}</p><p className="mt-1 text-xs text-muted-foreground">Do not assume potential aid is awarded.</p></div>
    </div>
    <div><h4 className="font-semibold">Scholarship matches</h4>{scholarships.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No scholarships found in the sources searched.</p> : <div className="mt-3 space-y-3">{scholarships.map((s, i) => <div key={`${String(s.name)}-${i}`} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{String(s.name || "Unnamed opportunity")}</p><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{String(s.eligibilityStatus || "insufficient information")}</span></div><p className="mt-2 text-sm"><span className="text-muted-foreground">Amount:</span> {String(s.amount || "Not found")}</p><p className="mt-1 text-sm"><span className="text-muted-foreground">Coverage:</span> {String(s.coverage || "Not stated")}</p><p className="mt-2 text-sm">{String(s.eligibilityReason || "Eligibility details not found.")}</p><p className="mt-2 text-sm"><span className="text-muted-foreground">Deadline:</span> {String(s.deadline || "Not found")}</p><p className="mt-1 text-sm"><span className="text-muted-foreground">Renewal:</span> {String(s.renewalRules || "Not stated")}</p></div>)}</div>}</div>
    <InfoList title="Missing requirements / unknowns" items={strings(finding.missingRequirements)} />
    <InfoList title="Recommended next steps" items={strings(finding.nextSteps)} />
    <div><h4 className="font-semibold">Sources</h4>{sources.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No source links attached to this finding. Treat claims as unverified.</p> : <ul className="mt-2 space-y-2">{sources.map((s, i) => <li key={`${String(s.url)}-${i}`} className="text-sm"><a className="break-all text-primary underline underline-offset-4" href={String(s.url || "#")} target="_blank" rel="noreferrer">{String(s.title || s.url || "Source")} <ExternalLink className="inline size-3" /></a><p className="mt-0.5 text-xs text-muted-foreground">{String(s.whyRelevant || "")}</p></li>)}</ul>}</div>
  </article>;
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div><h4 className="font-semibold">{title}</h4>{items.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">None identified in the returned report.</p>}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0 space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
