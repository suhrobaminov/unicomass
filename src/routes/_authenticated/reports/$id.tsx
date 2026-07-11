import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

type School = { school_name: string; tier: "Reach" | "Target" | "Safety"; admission_rate_estimate: string; reason_for_tier: string };
type Report = {
  profile_strength_score: number;
  summary_bullets: string[];
  categorized_schools: School[];
  profile_gaps: string[];
  actionable_next_steps: string[];
};

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({ meta: [{ title: "Strategy Report — youradviser" }] }),
  component: ReportView,
  notFoundComponent: () => <div className="p-10 text-center">Report not found.</div>,
});

function ReportView() {
  const { id } = Route.useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("reports").select("payload, created_at").eq("id", id).maybeSingle();
      if (error || !data) { setLoading(false); throw notFound(); }
      setReport(data.payload as Report);
      setCreatedAt(data.created_at);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!report) return null;

  const byTier = (tier: School["tier"]) => report.categorized_schools.filter(s => s.tier === tier);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between mb-6 no-print">
        <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <Button onClick={() => window.print()} variant="outline"><Printer className="h-4 w-4 mr-2" />Export PDF</Button>
      </div>

      <div className="mb-8">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Strategy Report • {new Date(createdAt).toLocaleDateString()}</div>
        <h1 className="font-display text-4xl font-semibold mt-1">Your admissions analysis</h1>
      </div>

      {/* Overview */}
      <Card className="p-8 shadow-soft mb-8">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <ScoreRing score={report.profile_strength_score} />
          <div>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Profile strength</div>
            <h2 className="font-display text-2xl font-semibold mt-1 mb-4">Your strategy at a glance</h2>
            <ul className="space-y-2">
              {report.summary_bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-accent">◆</span><span>{b}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Schools */}
      <h2 className="font-display text-2xl font-semibold mb-4">Recommended schools</h2>
      <Tabs defaultValue="Reach" className="mb-8">
        <TabsList>
          {(["Reach", "Target", "Safety"] as const).map(t => (
            <TabsTrigger key={t} value={t}>{t} ({byTier(t).length})</TabsTrigger>
          ))}
        </TabsList>
        {(["Reach", "Target", "Safety"] as const).map(tier => (
          <TabsContent key={tier} value={tier} className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {byTier(tier).map((s, i) => <SchoolCard key={i} school={s} />)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Gaps */}
      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Profile gaps</h2>
        <ul className="space-y-2">
          {report.profile_gaps.map((g, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Roadmap */}
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Your roadmap</h2>
        <div className="space-y-3">
          {report.actionable_next_steps.map((step, i) => (
            <label key={i} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary/40 cursor-pointer">
              <Checkbox checked={checked[i] ?? false} onCheckedChange={(v) => setChecked({ ...checked, [i]: !!v })} />
              <div>
                <div className="text-xs text-muted-foreground">Step {i + 1}</div>
                <div className={checked[i] ? "line-through text-muted-foreground" : ""}>{step}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>
    </main>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 140, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "var(--safety)" : score >= 60 ? "var(--target)" : "var(--reach)";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="rotate-90 origin-center font-display font-semibold" fontSize="34" fill="var(--foreground)" transform={`rotate(90 ${size / 2} ${size / 2})`}>{score}</text>
    </svg>
  );
}

function SchoolCard({ school }: { school: School }) {
  const tierColor: Record<School["tier"], string> = {
    Reach: "bg-[oklch(var(--reach)/0.1)] text-[oklch(var(--reach))] border-[oklch(var(--reach)/0.3)]",
    Target: "bg-[oklch(var(--target)/0.1)] text-[oklch(var(--target))] border-[oklch(var(--target)/0.3)]",
    Safety: "bg-[oklch(var(--safety)/0.1)] text-[oklch(var(--safety))] border-[oklch(var(--safety)/0.3)]",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg">{school.school_name}</h3>
        <Badge variant="outline" className={tierColor[school.tier]}>{school.tier}</Badge>
      </div>
      <div className="text-xs text-muted-foreground mb-3">Acceptance rate: {school.admission_rate_estimate}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{school.reason_for_tier}</p>
    </Card>
  );
}
