import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Compass,
  Award,
  Map,
  PenLine,
  Scale,
  Check,
  ArrowRight,
  Heart,
  Menu,
  MessageSquareText,
  Send,
  Lightbulb,
} from "lucide-react";
import { DonateDialog } from "@/components/donate-dialog";
import { LoginDialog } from "@/components/login-dialog";
import heroStudents from "@/assets/hero-students.jpg";
import { absoluteUrl } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UniCompass — Personalized University & Major Guidance" },
      {
        name: "description",
        content:
          "Build your academic profile once and get personalized university recommendations, major matches, scholarship options and a clear application roadmap.",
      },
      { property: "og:title", content: "UniCompass — Personalized University & Major Guidance" },
      {
        property: "og:description",
        content:
          "One profile, smarter decisions: university matches, major assessment, scholarships and an application roadmap.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: absoluteUrl("/") },
      { rel: "preload", as: "image", href: heroStudents, fetchPriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "UniCompass",
          url: absoluteUrl("/"),
          description:
            "Personalized university recommendations, major assessment and an application roadmap for high school students.",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-[#11120f] text-[#f2efe5]">
      <Nav />
      <main>
        <Hero />
        <StudyExperience />
        <Features />
        <HowItWorks />
        <Resources />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "Find Universities", href: "#features" },
  { label: "Find Your Major", href: "#features" },
  { label: "Scholarships", href: "#features" },
  { label: "Resources", href: "#resources" },
  { label: "Contact", href: "#contact" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Compass className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">UniCompass</span>
    </Link>
  );
}

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-[#34342e] bg-[#11120f]/95 text-[#f2efe5] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/find-your-major" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Find Your Major</Button>
          </Link>
          <LoginDialog>
            <Button size="sm" className="rounded-lg px-4">Get Started</Button>
          </LoginDialog>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="mobile-navigation" className="border-t border-border bg-background px-6 py-3 lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

const heroPoints = ["Personalized Recommendations", "Major Assessment", "Scholarship Finder"];

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 pb-20 md:pt-20 md:pb-24">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            University admissions guidance
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Find Your Perfect University.
            <br />
            <span className="text-primary">One Profile. Smarter Decisions.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Build your academic profile once and receive personalized university
            recommendations, scholarship matches, major suggestions, and a clear
            application roadmap.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <LoginDialog>
              <Button size="lg" className="h-12 rounded-xl px-7 text-base shadow-soft">
                Analyze My Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </LoginDialog>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 rounded-xl border-border px-7 text-base">
                How It Works
              </Button>
            </a>
          </div>
          <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {heroPoints.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-elegant">
            <img
              src={heroStudents}
              alt="University students on campus reviewing their study plans"
              fetchPriority="high"
              decoding="async"
              width={1200}
              height={1408}
              className="h-[380px] w-full object-cover md:h-[520px]"
            />
          </div>
          <DashboardCard />
        </div>
      </div>
    </section>
  );
}

function StudyExperience() {
  return (
    <section className="journal-section relative overflow-hidden border-y border-[#34342e] bg-[#11120f] text-[#f2efe5]">
      <style>{`
        @keyframes journal-rise { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes journal-page-turn { 0%, 15% { transform: rotateY(0deg); } 45%, 60% { transform: rotateY(-150deg); } 88%, 100% { transform: rotateY(-180deg); } }
        @keyframes journal-lamp { 0%,100% { opacity:.55; } 50% { opacity:.85; } }
        @keyframes journal-float { 0%,100% { transform:translateY(0) rotate(-1deg); } 50% { transform:translateY(-7px) rotate(.5deg); } }
        @keyframes journal-rule { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        .journal-reveal { animation:journal-rise .9s cubic-bezier(.2,.75,.25,1) both; }
        .journal-book { animation:journal-float 7s ease-in-out infinite; transform-style:preserve-3d; }
        .journal-page { transform-origin:left center; transform-style:preserve-3d; animation:journal-page-turn 8s cubic-bezier(.65,0,.35,1) infinite; backface-visibility:hidden; }
        .journal-lamp { animation:journal-lamp 6s ease-in-out infinite; }
        .journal-rule { transform-origin:left; animation:journal-rule 1.2s .35s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .journal-reveal,.journal-book,.journal-page,.journal-lamp,.journal-rule { animation:none !important; } }
      `}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[.9fr_1.1fr]">
        <div className="journal-reveal relative z-10">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.24em] text-[#c3a977]"><span className="h-px w-8 bg-[#c3a977]"/> The UniCompass journal / 01</p>
          <h2 className="mt-7 max-w-xl font-serif text-4xl font-medium leading-[1.04] tracking-[-.04em] sm:text-5xl md:text-6xl">
            Every future<br/>starts with a<br/><em className="font-normal text-[#c3a977]">first page.</em>
          </h2>
          <div className="journal-rule mt-7 h-px w-28 bg-[#c3a977]"/>
          <p className="mt-6 max-w-md text-base leading-7 text-[#b9b7ac]">
            The path to university isn't a template. It's a story shaped by your ambition, your choices, and the work you put in next.
          </p>
          <div className="mt-8 flex items-center gap-4 text-xs uppercase tracking-[.16em] text-[#c3c0b4]">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[#555348] font-serif text-sm text-[#d5bd8d]">01</span>
            <span>Discover your direction</span>
          </div>
        </div>
        <div className="journal-reveal relative mx-auto w-full max-w-[510px]" style={{animationDelay:".15s"}}>
          <div className="journal-lamp absolute -inset-8 rounded-full bg-[#c3a977]/10 blur-3xl"/>
          <div className="absolute -right-1 top-0 z-20 border border-[#4a493e] bg-[#191a16] px-4 py-3 shadow-xl">
            <p className="text-[9px] uppercase tracking-[.22em] text-[#b9a16f]">Field notes / 2026</p>
            <p className="mt-1 font-serif text-sm italic text-[#f2efe5]">Make room for possibility.</p>
          </div>
          <div className="journal-book relative mx-auto mt-8 h-[285px] w-[min(100%,430px)] [perspective:1600px] sm:h-[330px]">
            <div className="absolute inset-y-3 left-2 right-0 rounded-r-md bg-[#403728] shadow-2xl shadow-black/50"/>
            <div className="absolute inset-y-0 left-0 right-1 grid grid-cols-2 overflow-hidden border border-[#c9c0a8]/25 bg-[#e9e1cf] text-[#25241f] shadow-2xl">
              <div className="border-r border-[#c5bba6] px-5 py-6 sm:px-7 sm:py-8">
                <p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">Chapter one</p>
                <h3 className="mt-4 font-serif text-2xl leading-tight sm:text-3xl">Find your<br/><em>north.</em></h3>
                <p className="mt-4 text-[10px] leading-5 text-[#696456]">Start with what matters to you. Let curiosity do the rest.</p>
                <div className="mt-5 space-y-2">{[88,72,82,54].map((w,i)=><div key={i} className="h-px bg-[#aaa18f]" style={{width:w+"%"}}/>)}</div>
                <p className="mt-6 font-serif text-xs italic text-[#786a50]">A map is only the beginning.</p>
              </div>
              <div className="px-5 py-6 sm:px-7 sm:py-8">
                <p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">Your next steps</p>
                <div className="mt-5 space-y-5">{["Know your strengths","Explore your options","Build your plan"].map((s,i)=><div key={s} className="flex gap-3"><span className="font-serif text-xs italic text-[#9b8050]">0{i+1}</span><div><p className="font-serif text-sm">{s}</p><div className="mt-2 h-px w-16 bg-[#b9ae98]"/></div></div>)}</div>
                <div className="mt-7 border-t border-[#c5bba6] pt-4"><p className="text-[9px] uppercase tracking-[.18em] text-[#7b6b4e]">A note to self</p><p className="mt-2 font-serif text-sm italic">Keep going, even when the way isn't clear.</p></div>
              </div>
            </div>
            <div className="journal-page absolute inset-y-0 left-0 right-1 overflow-hidden border border-[#c9c0a8] bg-[#f3ecdc] px-5 py-6 text-[#25241f] shadow-lg sm:px-7 sm:py-8">
              <p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">A letter to your future self</p>
              <h3 className="mt-5 font-serif text-2xl leading-tight sm:text-3xl">The next chapter<br/><em>is yours to write.</em></h3>
              <p className="mt-4 max-w-[260px] font-serif text-sm leading-6 text-[#696456]">A little clarity today can change the choices you make tomorrow.</p>
              <div className="mt-5 space-y-3">{[94,82,89,65,78].map((w,i)=><div key={i} className="h-px bg-[#b9ae98]" style={{width:w+"%"}}/>)}</div>
              <p className="mt-7 font-serif text-xs italic text-[#8a744f]">UniCompass — notes for the road ahead</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#3b3b32] pt-4 text-[10px] uppercase tracking-[.18em] text-[#858477]">
            <span>Personal direction, not a preset path</span><span>01 — 03</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const dashboardRows = [
  { label: "Academic Score", value: "92 / 100" },
  { label: "Recommended Universities", value: "18 matches" },
  { label: "Major Match", value: "Computer Science" },
  { label: "Scholarship Matches", value: "7 programs" },
];

function DashboardCard() {
  return (
    <div className="mx-auto -mt-16 w-[min(100%,22rem)] rounded-2xl border border-border bg-card p-5 shadow-elegant sm:mx-0 lg:absolute lg:-bottom-10 lg:-left-10 lg:mt-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Profile Strength</span>
        <span className="text-sm font-semibold tabular-nums text-primary">86%</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-[86%] rounded-full bg-primary" />
      </div>
      <dl className="mt-5 space-y-3 border-t border-border pt-4">
        {dashboardRows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">Illustrative preview of your dashboard.</p>
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: "University Finder",
    desc: "Get a calibrated list of reach, target and safety universities based on your academics and goals.",
    cta: "Explore matches",
  },
  {
    icon: Compass,
    title: "Find Your Major",
    desc: "A 30-question assessment that maps your interests and strengths to the majors that fit you best.",
    cta: "Start assessment",
    to: "/find-your-major" as const,
  },
  {
    icon: Award,
    title: "Scholarship Matcher",
    desc: "Surface scholarship programs aligned with your profile, field of study and academic record.",
    cta: "Find scholarships",
  },
  {
    icon: Map,
    title: "Application Roadmap",
    desc: "A chronological checklist of what to do next, from testing and essays to deadlines.",
    cta: "View roadmap",
  },
  {
    icon: PenLine,
    title: "Essay Assistant",
    desc: "Structured guidance for your personal statement, with prompts tailored to each application.",
    cta: "Open assistant",
  },
  {
    icon: Scale,
    title: "Compare Universities",
    desc: "Put programs side by side on admissions profile, cost, outcomes and academic fit.",
    cta: "Compare programs",
  },
];

function Features() {
  return (
    <section id="features" className="border-y border-[#34342e] bg-[#171813] text-[#f2efe5]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to apply with confidence
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each tool works from the same profile, so your recommendations stay consistent
            across universities, majors, scholarships and deadlines.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow duration-200 hover:shadow-elegant">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="mt-6">
                {f.to ? (
                  <Link to={f.to}>
                    <Button variant="outline" size="sm" className="rounded-lg border-border">
                      {f.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-lg border-border">
                      {f.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    t: "Build your profile",
    d: "Four guided steps cover your academics, activities, awards and goals. Progress saves automatically as you go.",
  },
  {
    n: "02",
    t: "Get your analysis",
    d: "Your profile is evaluated holistically, the way an admissions reader would review it, and turned into a structured report.",
  },
  {
    n: "03",
    t: "Work the roadmap",
    d: "Follow concrete next steps, revisit your matches as your profile changes, and export everything as a PDF.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
        <p className="mt-4 text-muted-foreground">
          Three steps, one profile. No forms to repeat and no guesswork about what to do next.
        </p>
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((s) => (
          <div key={s.n} className="border-t border-border pt-6">
            <span className="text-sm font-semibold tabular-nums text-primary">{s.n}</span>
            <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const resources = [
  {
    t: "Understanding admissions",
    d: "How reach, target and safety lists are built, and what actually moves an application forward.",
  },
  {
    t: "Choosing a major",
    d: "What to weigh beyond salary: coursework, required skills, workload and long-term career paths.",
  },
  {
    t: "Funding your degree",
    d: "How scholarships, need-based aid and merit awards differ, and when each one is worth pursuing.",
  },
];

function Resources() {
  const [category, setCategory] = useState("Product suggestion");
  const [suggestion, setSuggestion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submitSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("site_feedback").insert({
      category,
      message: suggestion.trim(),
    });
    if (error) {
      console.error("Could not submit feedback:", error.message);
      setStatus("error");
      return;
    }
    setSuggestion("");
    setCategory("Product suggestion");
    setStatus("success");
  }

  return (
    <section id="resources" className="border-y border-[#34342e] bg-[#171813] text-[#f2efe5]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" /> Built with student feedback
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">Resources & feedback</h2>
            <p className="mt-4 text-muted-foreground">
              Explore practical guidance and help us improve UniCompass. Tell us what is missing, confusing, or worth building next.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <MessageSquareText className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Your input shapes the roadmap</p>
                <p className="mt-1 text-sm text-muted-foreground">Suggestions are reviewed by the UniCompass team and may inform future improvements. No email address or account is required. Please do not include sensitive personal information.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
              {resources.map((r) => (
                <div key={r.t} className="p-6">
                  <h3 className="text-base font-semibold">{r.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submitSuggestion} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Send className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold">Share a suggestion</h3>
                  <p className="text-sm text-muted-foreground">No email or sign-in required.</p>
                </div>
              </div>
              <label htmlFor="feedback-category" className="mt-5 block text-sm font-medium">Feedback category</label>
              <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Product suggestion</option>
                <option>Bug or technical issue</option>
                <option>University or scholarship data</option>
                <option>Design and usability</option>
                <option>Other feedback</option>
              </select>
              <label htmlFor="feedback-message" className="mt-4 block text-sm font-medium">Your suggestion</label>
              <textarea id="feedback-message" value={suggestion} onChange={(event) => { setSuggestion(event.target.value); if (status !== "sending") setStatus("idle"); }} required minLength={10} maxLength={3000} rows={5} placeholder="Tell us what would make UniCompass more useful..." className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button type="submit" disabled={status === "sending"} className="mt-5 w-full rounded-lg">
                <Send className="mr-2 h-4 w-4" /> {status === "sending" ? "Submitting..." : "Submit suggestion"}
              </Button>
              {status === "success" && <p role="status" className="mt-3 text-sm text-green-700">Thanks — your suggestion was submitted successfully.</p>}
              {status === "error" && <p role="alert" className="mt-3 text-sm text-destructive">We couldn't submit your suggestion. Please try again later.</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="rounded-3xl border border-border bg-card px-8 py-14 text-center shadow-soft md:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Questions or feedback?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Need help with UniCompass or have an idea to share? Contact the creator directly through any of these channels.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="mailto:suhrobaminov067@gmail.com" className="inline-flex">
            <Button size="lg" className="h-12 rounded-xl px-5 text-base">
              <MessageSquareText className="mr-2 h-4 w-4" /> Email
            </Button>
          </a>
          <a href="https://t.me/Uzbek_npc" target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-border px-5 text-base">
              <Send className="mr-2 h-4 w-4" /> Telegram
            </Button>
          </a>
          <a href="https://www.instagram.com/Uzbek.npc/" target="_blank" rel="noopener noreferrer" className="inline-flex">
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-border px-5 text-base">
              Instagram <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">Created by Suhrob Aminov · UniCompass</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Personalized university, major and scholarship guidance for students planning their applications.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Platform</span>
              <a href="#features" className="text-muted-foreground hover:text-foreground">Find Universities</a>
              <Link to="/find-your-major" className="text-muted-foreground hover:text-foreground">Find Your Major</Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground">Scholarships</a>
            </nav>
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Company</span>
              <a href="#resources" className="text-muted-foreground hover:text-foreground">Resources</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground">Contact</a>
              <DonateDialog>
                <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Heart className="h-3.5 w-3.5" /> Support us
                </button>
              </DonateDialog>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">© {new Date().getFullYear()} UniCompass</div>
      </div>
    </footer>
  );
}
