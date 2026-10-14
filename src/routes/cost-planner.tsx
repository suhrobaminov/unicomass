import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calculator, Plus, RotateCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/page-heading";

type CostRow = {
  id: string;
  name: string;
  tuition: string;
  housing: string;
  food: string;
  insurance: string;
  travel: string;
  other: string;
  scholarship: string;
  years: string;
};
const KEY = "unicompass.cost-planner.v1";
const blank = (id: string, name: string): CostRow => ({
  id, name, tuition: "", housing: "", food: "", insurance: "", travel: "", other: "", scholarship: "", years: "4",
});
const initialRows = (): CostRow[] => [blank("one", "University 1"), blank("two", "University 2"), blank("three", "University 3")];
const numeric = (value: string) => Math.max(0, Number(value) || 0);
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export const Route = createFileRoute("/cost-planner")({
  head: () => ({ meta: [
    { title: "College Cost Planner — UniCompass" },
    { name: "description", content: "Compare university costs, scholarships, and estimated net cost using figures you enter." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CostPlanner,
});

function CostPlanner() {
  const [rows, setRows] = useState<CostRow[]>(initialRows);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CostRow[];
        if (Array.isArray(parsed) && parsed.length) setRows(parsed.map((r, i) => ({ ...blank(r.id || String(i), r.name || `University ${i + 1}`), ...r })));
      }
    } catch { /* Ignore invalid local cache and use blank rows. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(rows)); }, [rows, loaded]);

  const totals = useMemo(() => rows.map((row) => {
    const tuition = numeric(row.tuition);
    const housing = numeric(row.housing);
    const food = numeric(row.food);
    const insurance = numeric(row.insurance);
    const travel = numeric(row.travel);
    const other = numeric(row.other);
    const scholarship = numeric(row.scholarship);
    const years = Math.max(1, Math.min(8, Math.round(numeric(row.years) || 4)));
    const annualGross = tuition + housing + food + insurance + travel + other;
    const annualAid = Math.min(scholarship, annualGross);
    return { annualGross, annualAid, annualNet: Math.max(0, annualGross - annualAid), totalNet: Math.max(0, annualGross - annualAid) * years, years };
  }), [rows]);

  const update = (id: string, field: keyof CostRow, value: string) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const add = () => setRows((prev) => [...prev, blank(`uni-${Date.now()}`, `University ${prev.length + 1}`)]);
  const reset = () => setRows(initialRows());

  return <>
    <PageHeading eyebrow="Plan with real numbers" title="College cost planner" description="Compare tuition, living costs, and scholarships to estimate what each university may cost you." />
    <main className="site-width py-8 sm:py-10 space-y-6">
      <div className="tool-panel page-enter">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Calculator className="size-5" /></span>
          <div><h2 className="text-lg font-semibold">Compare your options</h2><p className="mt-1 text-sm text-muted-foreground">Enter each university's published annual costs and confirmed scholarship amounts. All estimates are saved in this browser.</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={add}><Plus className="mr-2 size-4" />Add university</Button>
          <Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 size-4" />Reset planner</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {rows.map((row, index) => {
          const total = totals[index];
          const fields: Array<{ key: keyof CostRow; label: string; help?: string }> = [
            { key: "tuition", label: "Tuition & fees / year" },
            { key: "housing", label: "Housing / year" },
            { key: "food", label: "Food / year" },
            { key: "insurance", label: "Health insurance / year" },
            { key: "travel", label: "Travel / year" },
            { key: "other", label: "Other expenses / year" },
            { key: "scholarship", label: "Scholarships / grants per year" },
          ];
          return <section key={row.id} className="rounded-xl border bg-card p-5 shadow-soft card-lift">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold">{index + 1}</span>
              <div className="min-w-0 flex-1"><label className="text-xs text-muted-foreground" htmlFor={`name-${row.id}`}>University name</label><Input id={`name-${row.id}`} value={row.name} onChange={(e) => update(row.id, "name", e.target.value)} placeholder="Enter university name" /></div>
              <div className="w-24"><label className="text-xs text-muted-foreground" htmlFor={`years-${row.id}`}>Years</label><Input id={`years-${row.id}`} type="number" min="1" max="8" value={row.years} onChange={(e) => update(row.id, "years", e.target.value)} /></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fields.map((field) => <div key={field.key}><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor={`${field.key}-${row.id}`}>{field.label}</label><div className="relative"><span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span><Input id={`${field.key}-${row.id}`} type="number" min="0" step="100" className="pl-7" value={row[field.key]} onChange={(e) => update(row.id, field.key, e.target.value)} placeholder="0" /></div></div>)}
            </div>
            <div className="mt-5 rounded-lg bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">Estimated annual cost after aid</p>
              <p className="mt-1 text-2xl font-semibold">{money(total.annualNet)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                <div><p className="text-xs text-muted-foreground">Before aid / year</p><p className="font-medium">{money(total.annualGross)}</p></div>
                <div><p className="text-xs text-muted-foreground">Estimated net total</p><p className="font-medium text-primary">{money(total.totalNet)}</p></div>
              </div>
            </div>
          </section>;
        })}
      </div>

      <section className="tool-panel">
        <h2 className="text-lg font-semibold">Cost comparison</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lower estimated total is not automatically the best choice; compare academic fit, location, and verified aid conditions too.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b text-muted-foreground"><th className="py-3 pr-4 font-medium">University</th><th className="py-3 pr-4 font-medium">Annual gross</th><th className="py-3 pr-4 font-medium">Annual net</th><th className="py-3 font-medium">Estimated total</th></tr></thead>
            <tbody>{rows.map((row, i) => <tr key={row.id} className="border-b last:border-0"><td className="py-3 pr-4 font-medium">{row.name.trim() || `University ${i + 1}`}</td><td className="py-3 pr-4">{money(totals[i].annualGross)}</td><td className="py-3 pr-4">{money(totals[i].annualNet)}</td><td className="py-3 font-semibold">{money(totals[i].totalNet)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground"><Wallet className="mr-2 inline size-4" />Planning estimate only. Costs and aid are entered by you, not pulled from live university sources. Verify current tuition, living expenses, scholarship eligibility, renewal rules, and international-student aid directly with each university.</div>
      <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/dashboard"><ArrowLeft className="mr-2 size-4" />Back to admissions</Link></Button><Button asChild><Link to="/find-your-major">Explore majors</Link></Button></div>
    </main>
  </>;
}
