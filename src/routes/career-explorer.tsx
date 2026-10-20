import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, GraduationCap, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAJORS, type Major } from "@/lib/assessment-data";
import { loadStore } from "@/lib/local-store";
import { PageHeading } from "@/components/page-heading";

export const Route = createFileRoute("/career-explorer")({
  head: () => ({ meta: [
    { title: "Major & Career Explorer — UniCompass" },
    { name: "description", content: "Explore career paths, skills, coursework, and university ideas connected to your interests." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CareerExplorer,
});

function CareerExplorer() {
  const [selectedSlug, setSelectedSlug] = useState(MAJORS[0]?.slug ?? "");
  const [selectedCareer, setSelectedCareer] = useState("");
  const [topMatches, setTopMatches] = useState<Array<{ major: Major; score: number }>>([]);
  useEffect(() => {
    try {
      const saved = loadStore().assessment?.results as { ranked?: Array<{ slug?: string; score?: number }> } | null;
      const ranked = (saved?.ranked ?? []).map((r) => ({ major: MAJORS.find((m) => m.slug === r.slug), score: r.score ?? 0 })).filter((x): x is { major: Major; score: number } => Boolean(x.major)).slice(0, 5);
      setTopMatches(ranked);
      if (ranked[0]) setSelectedSlug(ranked[0].major.slug);
    } catch { /* Keep the catalog defaults if local storage is unavailable. */ }
  }, []);
  const major = useMemo(() => MAJORS.find((m) => m.slug === selectedSlug) ?? MAJORS[0], [selectedSlug]);
  const career = major.careers.includes(selectedCareer) ? selectedCareer : (major.careers[0] ?? "Explore related roles");
  const categoryCareers: Record<string, string[]> = {
    Technology: ["Software development", "Cybersecurity", "Data analysis", "IT systems"],
    Business: ["Business operations", "Market research", "Finance", "Entrepreneurship"],
    Health: ["Clinical practice", "Public health", "Health research", "Healthcare administration"],
    Engineering: ["Product engineering", "Systems design", "Quality engineering", "Research and development"],
    "Arts & Design": ["UX/UI design", "Visual communication", "Creative production", "Digital media"],
    Humanities: ["Writing and editing", "Education", "Research", "Public service"],
    Sciences: ["Laboratory research", "Data analysis", "Environmental science", "Scientific communication"],
    "Social Sciences": ["Policy analysis", "Counseling pathways", "Community research", "Human resources"],
  };
  return <>
    <PageHeading eyebrow="Turn interests into a plan" title="Major-to-career explorer" description="Explore what you might study, which skills you'll build, and the kinds of work each major can lead to." />
    <main className="site-width space-y-7 py-8 sm:py-10">
      {topMatches.length > 0 && <section className="tool-panel page-enter">
        <p className="eyebrow text-primary">Based on your saved assessment</p>
        <h2 className="mt-2 text-xl font-semibold">Your leading major matches</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a match to explore its career directions. Match scores indicate assessment alignment, not job or admissions probabilities.</p>
        <div className="mt-4 flex flex-wrap gap-2">{topMatches.map(({ major: m, score }) => <Button key={m.slug} variant={m.slug === selectedSlug ? "default" : "outline"} onClick={() => { setSelectedSlug(m.slug); setSelectedCareer(""); }}>{m.name}<span className="ml-2 text-xs opacity-75">{Math.round(score * 100)}%</span></Button>)}</div>
      </section>}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="tool-panel">
          <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary"><Target className="size-5" /></span><div><p className="eyebrow text-primary">Explore a pathway</p><h2 className="mt-1 text-xl font-semibold">Choose a major</h2><p className="mt-1 text-sm text-muted-foreground">Start from your assessment match or explore any major in the UniCompass catalog.</p></div></div>
          <div className="mt-5"><label className="mb-2 block text-sm font-medium">University major</label><Select value={selectedSlug} onValueChange={(v) => { setSelectedSlug(v); setSelectedCareer(""); }}><SelectTrigger><SelectValue placeholder="Choose a major" /></SelectTrigger><SelectContent>{MAJORS.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="mt-6 border-t pt-6"><h3 className="text-2xl font-semibold">{major.name}</h3><p className="mt-1 text-sm text-muted-foreground">{major.category}</p><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{major.blurb}</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="rounded-lg border p-4"><h4 className="flex items-center gap-2 font-medium"><Lightbulb className="size-4 text-primary" />Skills to build</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{major.requiredSkills.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}</ul></div><div className="rounded-lg border p-4"><h4 className="flex items-center gap-2 font-medium"><GraduationCap className="size-4 text-primary" />Subjects to expect</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{major.focusSubjects.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}</ul></div></div>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-xl border bg-card p-5"><BriefcaseBusiness className="size-5 text-primary" /><h3 className="mt-3 font-semibold">Career directions</h3><p className="mt-1 text-sm text-muted-foreground">These are example pathways, not guaranteed job outcomes.</p><div className="mt-4"><label className="mb-2 block text-xs text-muted-foreground">Explore a career</label><Select value={career} onValueChange={setSelectedCareer}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{major.careers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div className="mt-4 rounded-lg bg-muted/60 p-3"><p className="text-sm font-medium">{career}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Related skills: {major.requiredSkills.slice(0, 3).join(", ") || "See the skills list for this major"}.</p></div><h4 className="mt-5 text-sm font-medium">Other possible directions</h4><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{(categoryCareers[major.category] ?? []).filter((c) => c.toLowerCase() !== career.toLowerCase()).slice(0, 4).map((c) => <li key={c}>• {c}</li>)}</ul></div>
          <div className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Universities to research</h3><p className="mt-1 text-xs text-muted-foreground">Suggestions from the major catalog; verify each program and admissions requirements.</p><ul className="mt-3 space-y-2 text-sm">{major.topSchools.map((s) => <li key={s} className="border-b pb-2 last:border-0">{s}</li>)}</ul><h4 className="mt-4 text-sm font-medium">Scholarship ideas</h4><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{major.scholarships.slice(0, 4).map((s) => <li key={s}>• {s}</li>)}</ul></div>
        </aside>
      </section>
      <section className="rounded-xl border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold">Turn exploration into a plan</h2><p className="mt-1 text-sm text-muted-foreground">Compare estimated affordability or return to your assessment to review the majors that match your interests.</p><div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/find-your-major">Take the major assessment</Link></Button><Button asChild variant="outline"><Link to="/dashboard">Build admissions profile</Link></Button></div></section>
    </main>
  </>;
}
