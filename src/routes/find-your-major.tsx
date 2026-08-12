import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Download, FileText, GraduationCap,
  ListChecks, Loader2, RotateCcw, Target, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  QUESTIONS, computeTraitScores, rankMajors, deriveProfileLabel,
  deriveStrengths, deriveImprovements, type AnswerMap, type Major,
} from "@/lib/assessment-data";
import {
  finalizeAssessment, generateMajorInsight, upsertAssessment,
} from "@/lib/assessment.functions";

export const Route = createFileRoute("/find-your-major")({
  head: () => ({
    meta: [
      { title: "Find Your Major — UniCompass" },
      { name: "description", content: "A 30-question assessment that recommends the university majors that fit you best." },
      { property: "og:title", content: "Find Your Major — UniCompass" },
      { property: "og:description", content: "Answer 30 questions and get a ranked, evidence-based shortlist of university majors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FindYourMajorPage,
});

type Stage = "welcome" | "quiz" | "analyzing" | "results";

type ResultsPayload = {
  profileLabel: string;
  narrative: string;
  strengths: string[];
  improvements: string[];
  ranked: Array<{ major: Major; score: number }>;
};

function FindYourMajorPage() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [current, setCurrent] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | undefined>();
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);

  const upsert = useServerFn(upsertAssessment);
  const finalize = useServerFn(finalizeAssessment);
  const insight = useServerFn(generateMajorInsight);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("major_assessments")
        .select("id, answers, status")
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row) {
        setAssessmentId(row.id as string);
        const parsed = (row.answers ?? {}) as Record<string, number>;
        const restored: AnswerMap = {};
        for (const [k, v] of Object.entries(parsed)) restored[Number(k)] = v as 1 | 2 | 3 | 4 | 5;
        setAnswers(restored);
        const answeredCount = Object.keys(restored).length;
        if (answeredCount > 0 && answeredCount < QUESTIONS.length) {
          setCurrent(Math.min(answeredCount, QUESTIONS.length - 1));
        }
      }
      setLoadingResume(false);
    })();
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (stage !== "quiz") return;
    if (Object.keys(answers).length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const stringified: Record<string, number> = {};
        for (const [k, v] of Object.entries(answers)) stringified[k] = v;
        const r = await upsert({ data: { id: assessmentId, answers: stringified } });
        if (!assessmentId) setAssessmentId(r.id);
      } catch {
        /* silent */
      }
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [answers, stage, assessmentId, upsert]);

  const startFresh = () => {
    setAnswers({});
    setCurrent(0);
    setAssessmentId(undefined);
    setStage("quiz");
  };

  const answerCurrent = (value: 1 | 2 | 3 | 4 | 5) => {
    const q = QUESTIONS[current];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setTimeout(() => setCurrent((c) => Math.min(c + 1, QUESTIONS.length)), 160);
  };

  const finish = async () => {
    setStage("analyzing");
    const traits = computeTraitScores(answers);
    const ranked = rankMajors(traits);
    const label = deriveProfileLabel(traits);
    const strengths = deriveStrengths(traits);
    const improvements = deriveImprovements(traits);
    const topTraits = (Object.entries(traits) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    let narrative = "";
    try {
      const r = await insight({
        data: {
          profileLabel: label,
          topTraits,
          topMajors: ranked.slice(0, 5).map((x) => ({ name: x.major.name, score: x.score })),
        },
      });
      narrative = r.narrative;
    } catch (e) {
      narrative = "Your answers point to a distinctive mix of curiosity, focus, and drive. The majors below are matched to how you actually think and work.";
      if (e instanceof Error) console.warn(e.message);
    }
    const payload: ResultsPayload = { profileLabel: label, narrative, strengths, improvements, ranked };
    try {
      const stringified: Record<string, number> = {};
      for (const [k, v] of Object.entries(answers)) stringified[k] = v;
      saveAssessment({
        answers: stringified,
        completed: true,
        results: {
          profileLabel: payload.profileLabel,
          narrative: payload.narrative,
          strengths: payload.strengths,
          improvements: payload.improvements,
          trait_scores: traits,
          ranked: payload.ranked.map((r) => ({ slug: r.major.slug, name: r.major.name, score: r.score })),
        },
      });
    } catch (e) {
      if (e instanceof Error) toast.error(`Couldn't save results: ${e.message}`);
    }
    setResults(payload);
    setStage("results");
  };

  useEffect(() => {
    if (stage === "quiz" && current >= QUESTIONS.length) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, stage]);

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const canResume = !loadingResume && answeredCount > 0 && answeredCount < QUESTIONS.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20">
      {stage === "welcome" && (
        <Welcome onStart={startFresh} canResume={canResume} onResume={() => setStage("quiz")} answered={answeredCount} />
      )}
      {stage === "quiz" && current < QUESTIONS.length && (
        <QuizStep
          index={current}
          total={QUESTIONS.length}
          progress={progress}
          question={QUESTIONS[current]}
          value={answers[QUESTIONS[current].id]}
          onAnswer={answerCurrent}
          onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
          onNext={() => setCurrent((c) => Math.min(QUESTIONS.length - 1, c + 1))}
        />
      )}
      {stage === "analyzing" && <Analyzing />}
      {stage === "results" && results && (
        <Results
          data={results}
          onRetake={() => {
            setResults(null);
            setAnswers({});
            saveAssessment({ answers: {}, completed: false, results: null });
            setCurrent(0);
            setStage("welcome");
          }}
        />
      )}
    </div>
    </>
  );
}

/* ------------------------------- Welcome -------------------------------- */

function Welcome({
  onStart, canResume, onResume, answered,
}: { onStart: () => void; canResume: boolean; onResume: () => void; answered: number }) {
  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-sm text-muted-foreground">Assessment</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-foreground">Find your major</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Thirty statements about how you think, work, and what you want from a career. Your answers
        are scored against 20 university majors to produce a ranked shortlist you can act on.
      </p>

      <dl className="mt-10 grid gap-x-10 gap-y-6 border-t border-border pt-6 sm:grid-cols-3">
        {[
          ["Questions", "30 statements"],
          ["Time", "5–7 minutes"],
          ["Output", "Ranked report + PDF"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="mt-1 text-sm text-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button onClick={onStart} className="h-10">
          Begin assessment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {canResume && (
          <Button variant="outline" onClick={onResume} className="h-10">
            Resume ({answered}/{QUESTIONS.length})
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Progress saves automatically. You can retake it any time.</p>
    </div>
  );
}

/* --------------------------------- Quiz --------------------------------- */

const LIKERT: Array<{ v: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

function QuizStep({
  index, total, progress, question, value, onAnswer, onPrev, onNext,
}: {
  index: number; total: number; progress: number;
  question: { id: number; text: string };
  value?: 1 | 2 | 3 | 4 | 5;
  onAnswer: (v: 1 | 2 | 3 | 4 | 5) => void;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mt-3 h-[3px] w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 key={question.id} className="animate-in fade-in duration-200 mt-14 text-2xl md:text-[30px] leading-snug font-medium text-foreground">
        {question.text}
      </h2>

      <div className="mt-10 space-y-2">
        {LIKERT.map((opt) => {
          const active = value === opt.v;
          return (
            <button
              key={opt.v}
              onClick={() => onAnswer(opt.v)}
              className={
                "flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-left text-sm transition-colors duration-150 " +
                (active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground")
              }
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                    (active ? "border-primary bg-primary text-primary-foreground" : "border-border")
                  }
                >
                  {active ? <Check className="h-3 w-3" /> : opt.v}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={index === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!value}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Saved automatically</p>
    </div>
  );
}

function Analyzing() {
  const steps = useMemo(
    () => ["Scoring your traits", "Comparing 20 majors", "Writing your summary"],
    [],
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % steps.length), 1400);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="py-24">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <h2 className="mt-6 text-xl font-medium text-foreground">Preparing your report</h2>
      <p className="mt-2 text-sm text-muted-foreground">{steps[i]}…</p>
    </div>
  );
}

/* -------------------------------- Results ------------------------------- */

function Results({ data, onRetake }: { data: ResultsPayload; onRetake: () => void }) {
  const top5 = data.ranked.slice(0, 5);
  const [selected, setSelected] = useState<string>(top5[0].major.slug);
  const active = useMemo(() => top5.find((m) => m.major.slug === selected) ?? top5[0], [top5, selected]);
  const [exporting, setExporting] = useState(false);
  const date = useMemo(() => new Date(), []);

  const download = async () => {
    setExporting(true);
    try {
      const { generateAssessmentPdf } = await import("@/lib/report-pdf");
      generateAssessmentPdf(data, { date });
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Report header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Major assessment report</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-foreground">{data.profileLabel}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={download} disabled={exporting} className="h-9">
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF report
          </Button>
          <Button variant="outline" size="icon" onClick={onRetake} title="Retake assessment" className="h-9 w-9">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <section className="py-8">
        <p className="max-w-2xl text-[15px] leading-relaxed text-foreground/90">{data.narrative}</p>
        <dl className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Top match", top5[0].major.name],
            ["Compatibility", `${Math.round(top5[0].score * 100)}%`],
            ["Majors compared", String(data.ranked.length)],
          ].map(([k, v]) => (
            <div key={k} className="px-0 py-4 sm:px-5 first:sm:pl-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-[15px] font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Ranking */}
      <Section title="Recommended majors" hint="Select a major to see the detail below.">
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {top5.map((r, idx) => {
            const pct = Math.round(r.score * 100);
            const isActive = r.major.slug === selected;
            return (
              <button
                key={r.major.slug}
                onClick={() => setSelected(r.major.slug)}
                className={
                  "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 " +
                  (isActive ? "bg-muted/60" : "hover:bg-muted/40")
                }
              >
                <span className="w-4 text-sm tabular-nums text-muted-foreground">{idx + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{r.major.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.major.category}</span>
                </span>
                <span className="hidden w-32 sm:block">
                  <span className="block h-[3px] w-full rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <span className="w-12 text-right text-sm tabular-nums font-medium text-foreground">{pct}%</span>
                <ChevronRight className={"h-4 w-4 " + (isActive ? "text-foreground" : "text-muted-foreground/50")} />
              </button>
            );
          })}
        </div>
      </Section>

      {/* Detail */}
      <Section title={active.major.name} hint={active.major.category}>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{active.major.blurb}</p>
        <dl className="mt-6 grid gap-x-10 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
          {[
            ["Average salary", active.major.salaryUSD],
            ["Job outlook", active.major.outlook],
            ["Difficulty", active.major.difficulty],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <List title="Required skills" items={active.major.requiredSkills} />
          <List title="Focus subjects" items={active.major.focusSubjects} />
          <List title="Typical careers" items={active.major.careers} />
          <List title="Universities to consider" items={active.major.topSchools} />
          <List title="Scholarships" items={active.major.scholarships} />
        </div>
      </Section>

      {/* Strengths / growth */}
      <Section title="Profile analysis">
        <div className="grid gap-8 sm:grid-cols-2">
          <List
            title="Strengths"
            items={data.strengths.length ? data.strengths : ["No dominant strengths detected"]}
          />
          <List
            title="Areas to grow"
            items={data.improvements.length ? data.improvements : ["Well-rounded across measured traits"]}
          />
        </div>
      </Section>

      {/* Next steps */}
      <Section title="Next steps">
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard">
            <Button variant="outline" size="sm"><GraduationCap className="mr-2 h-4 w-4" />Explore universities</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm"><Wallet className="mr-2 h-4 w-4" />Find scholarships</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm"><Target className="mr-2 h-4 w-4" />Build strategy report</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={download} disabled={exporting}>
            <FileText className="mr-2 h-4 w-4" />Download PDF report
          </Button>
          <Button variant="ghost" size="sm" onClick={onRetake}>
            <ListChecks className="mr-2 h-4 w-4" />Retake assessment
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
