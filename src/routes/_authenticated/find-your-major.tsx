import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Trophy, Compass, GraduationCap, Wallet, TrendingUp, Gauge, Bookmark, Download, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  QUESTIONS, MAJORS, computeTraitScores, rankMajors, deriveProfileLabel,
  deriveStrengths, deriveImprovements, type AnswerMap, type Major,
} from "@/lib/assessment-data";
import {
  finalizeAssessment, generateMajorInsight, upsertAssessment,
} from "@/lib/assessment.functions";

export const Route = createFileRoute("/_authenticated/find-your-major")({
  head: () => ({
    meta: [
      { title: "Find Your Major — youradviser" },
      { name: "description", content: "A 30-question AI assessment that recommends the university majors that fit you best." },
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

  // Resume in-progress assessment if any.
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
        for (const [k, v] of Object.entries(parsed)) {
          restored[Number(k)] = v as 1 | 2 | 3 | 4 | 5;
        }
        setAnswers(restored);
        const answeredCount = Object.keys(restored).length;
        if (answeredCount > 0 && answeredCount < QUESTIONS.length) {
          setCurrent(Math.min(answeredCount, QUESTIONS.length - 1));
        }
      }
      setLoadingResume(false);
    })();
  }, []);

  // Autosave answers (debounced) once quiz has started.
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

  const resume = () => setStage("quiz");

  const answerCurrent = (value: 1 | 2 | 3 | 4 | 5) => {
    const q = QUESTIONS[current];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    // Advance shortly after selection for a smoother feel.
    setTimeout(() => {
      setCurrent((c) => Math.min(c + 1, QUESTIONS.length));
    }, 220);
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
          topMajors: ranked.slice(0, 5).map((r) => ({ name: r.major.name, score: r.score })),
        },
      });
      narrative = r.narrative;
    } catch (e) {
      narrative = "Your answers show a distinctive blend of curiosity, focus, and drive. The majors below are calibrated to how you actually think and work — not just to your grades.";
      if (e instanceof Error) console.warn(e.message);
    }
    const payload: ResultsPayload = { profileLabel: label, narrative, strengths, improvements, ranked };
    try {
      const stringified: Record<string, number> = {};
      for (const [k, v] of Object.entries(answers)) stringified[k] = v;
      const serializableResults = {
        profileLabel: payload.profileLabel,
        narrative: payload.narrative,
        strengths: payload.strengths,
        improvements: payload.improvements,
        ranked: payload.ranked.map((r) => ({ slug: r.major.slug, name: r.major.name, score: r.score })),
      };
      await finalize({
        data: { id: assessmentId, answers: stringified, trait_scores: traits, results: serializableResults },
      });
    } catch (e) {
      if (e instanceof Error) toast.error(`Couldn't save results: ${e.message}`);
    }
    setResults(payload);
    setStage("results");
    setTimeout(() => celebrate(), 200);
  };

  useEffect(() => {
    if (stage === "quiz" && current >= QUESTIONS.length) {
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, stage]);

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const canResume = !loadingResume && answeredCount > 0 && answeredCount < QUESTIONS.length;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <BackgroundGlow />
      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {stage === "welcome" && (
          <Welcome onStart={startFresh} canResume={canResume} onResume={resume} />
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
              setAssessmentId(undefined);
              setCurrent(0);
              setStage("welcome");
            }}
          />
        )}
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.22_290/0.35),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.22_240/0.32),transparent_70%)] blur-3xl" />
    </>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_10px_40px_-12px_oklch(0.15_0.08_265/0.55)] " +
        className
      }
    >
      {children}
    </div>
  );
}

function Welcome({ onStart, canResume, onResume }: { onStart: () => void; canResume: boolean; onResume: () => void }) {
  return (
    <div className="animate-fade-in text-center">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[oklch(0.75_0.18_290)]" />
        AI Career Assessment
      </div>
      <h1 className="mt-6 font-display text-4xl md:text-6xl font-semibold tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
        Find Your Perfect University Major
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-white/70 leading-relaxed">
        Answer 30 questions about your interests, strengths, and career preferences. Our AI will analyze your responses and recommend the majors that best match your profile.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button size="lg" onClick={onStart} className="h-12 px-8 bg-gradient-to-r from-[oklch(0.55_0.22_290)] to-[oklch(0.6_0.2_240)] text-white shadow-[0_10px_30px_-10px_oklch(0.55_0.22_290/0.7)] hover:opacity-95">
          Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {canResume && (
          <Button size="lg" variant="ghost" onClick={onResume} className="h-12 text-white/80 hover:text-white hover:bg-white/10">
            Resume where you left off
          </Button>
        )}
      </div>
      <div className="mt-4 text-sm text-white/50">Estimated time: 5–7 minutes</div>

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Compass, t: "30 calibrated questions", d: "Interests, personality, work style, and long-term goals." },
          { icon: Trophy, t: "Personalized profile", d: "A unique persona label plus your six strongest traits." },
          { icon: GraduationCap, t: "Ranked major matches", d: "Top 5 majors with careers, salary, universities, and scholarships." },
        ].map((it) => (
          <GlassCard key={it.t} className="p-5 text-left">
            <it.icon className="h-5 w-5 text-[oklch(0.8_0.15_290)]" />
            <div className="mt-3 font-medium text-white">{it.t}</div>
            <div className="mt-1 text-sm text-white/60">{it.d}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

const LIKERT: Array<{ v: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { v: 1, label: "Strongly Disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly Agree" },
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
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between text-sm text-white/60">
        <span>Question {index + 1} of {total}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.22_290)] to-[oklch(0.6_0.2_240)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <GlassCard className="mt-8 p-8 md:p-10">
        <div className="text-xs uppercase tracking-widest text-white/40">Question {index + 1}</div>
        <h2 className="mt-3 font-display text-2xl md:text-3xl font-medium text-white leading-snug" key={question.id}>
          <span className="inline-block animate-fade-in">{question.text}</span>
        </h2>

        <div className="mt-8 grid gap-2 sm:grid-cols-5">
          {LIKERT.map((opt) => {
            const active = value === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => onAnswer(opt.v)}
                className={
                  "group relative rounded-xl border px-3 py-4 text-center text-sm transition-all duration-200 " +
                  (active
                    ? "border-transparent bg-gradient-to-br from-[oklch(0.55_0.22_290)] to-[oklch(0.6_0.2_240)] text-white shadow-[0_8px_28px_-10px_oklch(0.55_0.22_290/0.8)] scale-[1.03]"
                    : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02]")
                }
              >
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-xs font-semibold">
                  {opt.v}
                </div>
                <div className="text-[11px] leading-tight">{opt.label}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={onPrev} disabled={index === 0} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={onNext}
            disabled={!value}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GlassCard>

      <div className="mt-4 text-center text-xs text-white/40">Your progress is saved automatically.</div>
    </div>
  );
}

function Analyzing() {
  const steps = ["Scoring your traits", "Matching against 20 university majors", "Writing your personalized profile"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % steps.length), 1400);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="animate-fade-in text-center py-16">
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[oklch(0.55_0.22_290)] to-[oklch(0.6_0.2_240)] blur-xl opacity-70 animate-pulse" />
        <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      </div>
      <h2 className="mt-8 font-display text-2xl text-white">Analyzing your profile…</h2>
      <p className="mt-2 text-white/60 transition-opacity" key={i}>{steps[i]}</p>
    </div>
  );
}

function celebrate() {
  const duration = 900;
  const end = Date.now() + duration;
  const colors = ["#a78bfa", "#818cf8", "#67e8f9", "#c4b5fd"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function Results({ data, onRetake }: { data: ResultsPayload; onRetake: () => void }) {
  const top5 = data.ranked.slice(0, 5);
  const [selected, setSelected] = useState<string>(top5[0].major.slug);
  const activeMajor = useMemo(() => top5.find((m) => m.major.slug === selected) ?? top5[0], [top5, selected]);
  const topPct = Math.round(top5[0].score * 100);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <GlassCard className="p-8 md:p-10 text-center">
        <div className="text-xs uppercase tracking-widest text-white/50">Your profile</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
          {data.profileLabel}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/70 leading-relaxed">{data.narrative}</p>
        <div className="mt-8 flex items-center justify-center">
          <ScoreRing value={topPct} />
        </div>
        <div className="mt-2 text-sm text-white/60">Top match confidence</div>
      </GlassCard>

      {/* Top 5 majors */}
      <div>
        <h2 className="font-display text-2xl text-white mb-4">Top 5 Recommended Majors</h2>
        <div className="grid gap-3">
          {top5.map((r, idx) => {
            const pct = Math.round(r.score * 100);
            const active = r.major.slug === selected;
            return (
              <button
                key={r.major.slug}
                onClick={() => setSelected(r.major.slug)}
                className={
                  "group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 " +
                  (active
                    ? "border-transparent bg-gradient-to-r from-[oklch(0.55_0.22_290)]/25 to-[oklch(0.6_0.2_240)]/25 shadow-[0_10px_40px_-15px_oklch(0.55_0.22_290/0.6)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20")
                }
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white/80">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{r.major.name}</div>
                    <div className="text-xs text-white/60">{r.major.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-white">{pct}%</div>
                    <div className="text-[11px] text-white/50">Match</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[oklch(0.75_0.18_290)] to-[oklch(0.7_0.18_240)] transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected major detail */}
      <MajorDetail entry={activeMajor} />

      {/* Strengths + Improvements */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/80">
            <TrendingUp className="h-4 w-4 text-[oklch(0.75_0.18_290)]" />
            <span className="text-sm uppercase tracking-widest">Your strengths</span>
          </div>
          <ul className="mt-4 space-y-2">
            {data.strengths.length === 0 && <li className="text-white/60 text-sm">Complete more of the assessment to reveal your strengths.</li>}
            {data.strengths.map((s) => (
              <li key={s} className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.75_0.18_150)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/80">
            <Gauge className="h-4 w-4 text-[oklch(0.75_0.18_60)]" />
            <span className="text-sm uppercase tracking-widest">Areas to grow</span>
          </div>
          <ul className="mt-4 space-y-2 text-white/90 text-sm leading-relaxed">
            {data.improvements.length === 0 && <li className="text-white/60">You're well-rounded — keep sharpening your top strengths.</li>}
            {data.improvements.map((s) => (<li key={s}>• {s}</li>))}
          </ul>
        </GlassCard>
      </div>

      {/* Next steps */}
      <GlassCard className="p-6">
        <div className="text-sm uppercase tracking-widest text-white/60">Next steps</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/dashboard"><Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10"><GraduationCap className="mr-2 h-4 w-4" />Explore Universities</Button></Link>
          <Link to="/dashboard"><Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10"><Wallet className="mr-2 h-4 w-4" />Find Scholarships</Button></Link>
          <Link to="/dashboard"><Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10"><Bookmark className="mr-2 h-4 w-4" />Compare Universities</Button></Link>
          <Button variant="ghost" onClick={() => { toast.success("Saved to your assessment history."); }} className="text-white/90 hover:text-white hover:bg-white/10">
            <Bookmark className="mr-2 h-4 w-4" />Save Results
          </Button>
          <Button variant="ghost" onClick={() => window.print()} className="text-white/90 hover:text-white hover:bg-white/10">
            <Download className="mr-2 h-4 w-4" />Download PDF
          </Button>
          <Button onClick={onRetake} className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
            <RotateCcw className="mr-2 h-4 w-4" />Retake Assessment
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.75 0.18 290)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 240)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-semibold text-white">{value}%</div>
        <div className="text-[10px] uppercase tracking-widest text-white/50">Match</div>
      </div>
    </div>
  );
}

function MajorDetail({ entry }: { entry: { major: Major; score: number } }) {
  const m = entry.major;
  return (
    <GlassCard className="p-6 md:p-8" key={m.slug}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">{m.category}</div>
          <h3 className="mt-1 font-display text-2xl md:text-3xl font-semibold text-white">{m.name}</h3>
          <p className="mt-2 max-w-2xl text-white/70">{m.blurb}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-semibold text-white">{Math.round(entry.score * 100)}%</div>
          <div className="text-xs text-white/50">Compatibility</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DetailBlock title="Required skills" items={m.requiredSkills} />
        <DetailBlock title="Focus subjects" items={m.focusSubjects} />
        <DetailBlock title="Typical careers" items={m.careers} />
        <DetailBlock title="Top universities" items={m.topSchools} />
        <DetailBlock title="Scholarships" items={m.scholarships} />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-widest text-white/50">At a glance</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-white/80"><span>Average salary</span><span className="text-white">{m.salaryUSD}</span></div>
            <div className="flex justify-between text-white/80"><span>Job outlook</span><span className="text-white">{m.outlook}</span></div>
            <div className="flex justify-between text-white/80"><span>Difficulty</span><span className="text-white">{m.difficulty}</span></div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-widest text-white/50">{title}</div>
      <ul className="mt-3 space-y-1.5 text-sm text-white/85">
        {items.map((i) => <li key={i}>• {i}</li>)}
      </ul>
    </div>
  );
}
