import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/page-heading";

type Requirement = { id: string; name: string; required: string; studentValue: string; sourceUrl: string; deadline: string };
type School = { id: string; name: string; program: string; intake: string; requirements: Requirement[] };
const newRequirement = (): Requirement => ({ id: crypto.randomUUID(), name: "", required: "", studentValue: "", sourceUrl: "", deadline: "" });
const newSchool = (): School => ({ id: crypto.randomUUID(), name: "", program: "", intake: "Fall 2027", requirements: [
  { ...newRequirement(), name: "Minimum GPA", required: "", studentValue: "" },
  { ...newRequirement(), name: "English test (IELTS/TOEFL)", required: "", studentValue: "" },
  { ...newRequirement(), name: "SAT / ACT", required: "", studentValue: "" },
  { ...newRequirement(), name: "Required documents", required: "Transcript, recommendation letters, personal statement", studentValue: "" },
] });

export const Route = createFileRoute("/readiness-auditor")({
  head: () => ({ meta: [
    { title: "Application Readiness Auditor — UniCompass" },
    { name: "description", content: "Compare your student profile with university application requirements, track evidence, and identify missing steps." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: ReadinessAuditor,
});

function ReadinessAuditor() {
  const [student, setStudent] = useState({ name: "", citizenship: "Uzbekistan", degree: "Bachelor's", major: "Computer Science", gpa: "", english: "IELTS", englishScore: "", sat: "", act: "", enrollment: "Fall 2027" });
  const [schools, setSchools] = useState<School[]>([newSchool()]);
  const [showPrintHelp, setShowPrintHelp] = useState(false);
  const updateStudent = (key: keyof typeof student, value: string) => setStudent(p => ({ ...p, [key]: value }));
  const updateSchool = (schoolId: string, patch: Partial<School>) => setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, ...patch } : s));
  const updateRequirement = (schoolId: string, reqId: string, patch: Partial<Requirement>) => setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, requirements: s.requirements.map(r => r.id === reqId ? { ...r, ...patch } : r) } : s));
  const addSchool = () => setSchools(prev => prev.length >= 8 ? prev : [...prev, newSchool()]);
  const removeSchool = (id: string) => setSchools(prev => prev.filter(s => s.id !== id));
  const addRequirement = (id: string) => setSchools(prev => prev.map(s => s.id === id && s.requirements.length < 20 ? { ...s, requirements: [...s.requirements, newRequirement()] } : s));
  const removeRequirement = (schoolId: string, reqId: string) => setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, requirements: s.requirements.filter(r => r.id !== reqId) } : s));

  const audits = useMemo(() => schools.map(school => {
    const rows = school.requirements.map(r => {
      const have = r.studentValue.trim();
      const need = r.required.trim();
      let status: "meets" | "gap" | "unknown" = "unknown";
      const numeric = (v: string) => { const match = v.replace(",", ".").match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : NaN; };
      const lower = r.name.toLowerCase();
      if (have && need && /(gpa|ielts|toefl|duolingo|sat|act|score|minimum grade|minimum mark)/i.test(lower)) {
        const a = numeric(have), b = numeric(need);
        if (Number.isFinite(a) && Number.isFinite(b)) status = a >= b ? "meets" : "gap";
        else status = "unknown";
      } else if (have && need && /(document|transcript|recommendation|essay|statement|portfolio|passport|proof|certificate)/i.test(lower)) {
        const list = need.split(/[,;\n]/).map(x => x.trim().toLowerCase()).filter(Boolean);
        const supplied = have.toLowerCase();
        status = list.length && list.every(item => supplied.includes(item)) ? "meets" : "gap";
      } else if (have && need && have.toLowerCase() === need.toLowerCase()) status = "meets";
      return { ...r, status };
    });
    return { ...school, rows, counts: { meets: rows.filter(r => r.status === "meets").length, gap: rows.filter(r => r.status === "gap").length, unknown: rows.filter(r => r.status === "unknown").length } };
  }), [schools]);

  const total = audits.reduce((acc, s) => ({ meets: acc.meets + s.counts.meets, gap: acc.gap + s.counts.gap, unknown: acc.unknown + s.counts.unknown }), { meets: 0, gap: 0, unknown: 0 });

  return <>
    <PageHeading eyebrow="Evidence-first admissions planning" title="Application Readiness Auditor" description="Compare your current profile with requirements for each university, identify gaps, and keep the official evidence in one place." />
    <main className="site-width space-y-6 py-8 sm:py-10">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground"><AlertTriangle className="mr-2 inline size-4" />This version does not scrape university websites or use AI. Enter requirements from official admissions pages; the auditor compares values you provide and flags anything it cannot reliably determine. Always confirm requirements with the university.</div>
      <section className="tool-panel space-y-4">
        <div><h2 className="text-xl font-semibold">Your profile</h2><p className="mt-1 text-sm text-muted-foreground">Use the same units and grading scale shown by each university.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name (optional)"><Input value={student.name} onChange={e => updateStudent("name", e.target.value)} placeholder="Your name" /></Field>
          <Field label="Citizenship"><Input value={student.citizenship} onChange={e => updateStudent("citizenship", e.target.value)} /></Field>
          <Field label="Degree level"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={student.degree} onChange={e => updateStudent("degree", e.target.value)}><option>Bachelor's</option><option>Associate</option><option>Master's</option><option>PhD</option><option>Other</option></select></Field>
          <Field label="Intended major"><Input value={student.major} onChange={e => updateStudent("major", e.target.value)} /></Field>
          <Field label="Expected enrollment"><Input value={student.enrollment} onChange={e => updateStudent("enrollment", e.target.value)} /></Field>
          <Field label="GPA / grading scale"><Input value={student.gpa} onChange={e => updateStudent("gpa", e.target.value)} placeholder="e.g. 3.8/4.0 or 90/100" /></Field>
          <Field label="English test"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={student.english} onChange={e => updateStudent("english", e.target.value)}><option>IELTS</option><option>TOEFL</option><option>Duolingo English Test</option><option>Not taken</option><option>Other</option></select></Field>
          <Field label="English score"><Input value={student.englishScore} onChange={e => updateStudent("englishScore", e.target.value)} placeholder="e.g. 7.0" /></Field>
          <Field label="SAT score"><Input value={student.sat} onChange={e => updateStudent("sat", e.target.value)} placeholder="Optional" /></Field>
          <Field label="ACT score"><Input value={student.act} onChange={e => updateStudent("act", e.target.value)} placeholder="Optional" /></Field>
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">University applications</h2><p className="mt-1 text-sm text-muted-foreground">Track up to eight institutions. Each requirement can link directly to its official source.</p></div><Button variant="outline" onClick={addSchool} disabled={schools.length >= 8}><Plus className="mr-2 size-4" />Add university</Button></div>
      {schools.map((school, index) => {
        const audit = audits.find(a => a.id === school.id)!;
        return <section key={school.id} className="rounded-xl border bg-card p-4 shadow-soft sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">University {index + 1}</p><h3 className="text-lg font-semibold">{school.name || "New application"}</h3></div><div className="flex gap-2"><Status label={`${audit.counts.meets} meet`} kind="meets" /><Status label={`${audit.counts.gap} gaps`} kind="gap" /><Status label={`${audit.counts.unknown} unknown`} kind="unknown" /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="University name"><Input value={school.name} onChange={e => updateSchool(school.id, { name: e.target.value })} placeholder="e.g. University of Toronto" /></Field><Field label="Program / department"><Input value={school.program} onChange={e => updateSchool(school.id, { program: e.target.value })} placeholder="e.g. Computer Science, BSc" /></Field><Field label="Intended intake"><Input value={school.intake} onChange={e => updateSchool(school.id, { intake: e.target.value })} /></Field></div>
          <div className="space-y-3">
            {audit.rows.map((r, i) => <div key={r.id} className="rounded-lg border p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2">{r.status === "meets" ? <CheckCircle2 className="size-4 text-emerald-600" /> : r.status === "gap" ? <AlertTriangle className="size-4 text-amber-600" /> : <CircleHelp className="size-4 text-muted-foreground" />}<span className="text-sm font-semibold">{r.name || `Requirement ${i + 1}`}</span></div><div className="flex items-center gap-2"><Status label={r.status === "meets" ? "Meets entered rule" : r.status === "gap" ? "Needs attention" : "Unverified"} kind={r.status} />{school.requirements.length > 1 && <Button variant="ghost" size="icon" aria-label="Remove requirement" onClick={() => removeRequirement(school.id, r.id)}><Trash2 className="size-4" /></Button>}</div></div>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Requirement name"><Input value={r.name} onChange={e => updateRequirement(school.id, r.id, { name: e.target.value })} placeholder="e.g. Minimum IELTS" /></Field><Field label="Published requirement"><Input value={r.required} onChange={e => updateRequirement(school.id, r.id, { required: e.target.value })} placeholder="e.g. 6.5" /></Field><Field label="Your value / document status"><Input value={r.studentValue} onChange={e => updateRequirement(school.id, r.id, { studentValue: e.target.value })} placeholder="e.g. 7.0 or list documents ready" /></Field><Field label="Application deadline"><Input value={r.deadline} onChange={e => updateRequirement(school.id, r.id, { deadline: e.target.value })} placeholder="e.g. January 15, 2027" /></Field><div className="sm:col-span-2"><Field label="Official source URL"><Input value={r.sourceUrl} onChange={e => updateRequirement(school.id, r.id, { sourceUrl: e.target.value })} placeholder="https://university.edu/admissions/requirements" /></Field>{r.sourceUrl && <a className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4" href={r.sourceUrl} target="_blank" rel="noreferrer">Open source page <ExternalLink className="size-3" /></a>}</div></div>
              {r.status === "gap" && <p className="text-sm text-amber-700 dark:text-amber-300">Action: review this requirement and plan how to address it before applying.</p>}
            </div>)}
            <Button variant="outline" size="sm" onClick={() => addRequirement(school.id)} disabled={school.requirements.length >= 20}><Plus className="mr-2 size-4" />Add requirement</Button>
          </div>
          <Field label="Notes / next steps"><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Contact admissions, request transcript, confirm test-optional policy..." /></Field>
          {schools.length > 1 && <div className="flex justify-end"><Button variant="ghost" onClick={() => removeSchool(school.id)}><Trash2 className="mr-2 size-4" />Remove university</Button></div>}
        </section>;
      })}

      <section className="tool-panel">
        <h2 className="text-xl font-semibold">Readiness overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Based only on the requirements and values you entered. This is not an admission prediction.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Meets entered rules" value={total.meets} />
          <Metric label="Needs attention" value={total.gap} />
          <Metric label="Unverified" value={total.unknown} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3 no-print"><Button onClick={() => window.print()}>Print / save as PDF</Button><Button variant="outline" onClick={() => { setShowPrintHelp(true); window.print(); }}>Export checklist</Button><Button variant="outline" onClick={() => { const payload = JSON.stringify({ exportedAt: new Date().toISOString(), student, schools }, null, 2); const blob = new Blob([payload], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "unicompass-readiness-checklist.json"; a.click(); URL.revokeObjectURL(url); }}>Download backup (JSON)</Button></div>
        {showPrintHelp && <p className="mt-3 text-sm text-muted-foreground">In the print dialog, choose “Save as PDF”.</p>}
      </section>
      <p className="text-xs text-muted-foreground">Privacy: this checklist stays in the current browser session and is not sent to UniCompass servers. Download a JSON backup before closing or refreshing the page.</p>
    </main>
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}</label>; }
function Status({ label, kind }: { label: string; kind: string }) {
  const classes = kind === "meets" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : kind === "gap" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-border bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${classes}`}>{label}</span>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>; }
