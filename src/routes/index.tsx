import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { DonateDialog } from "@/components/donate-dialog";
import heroStudents from "@/assets/hero-students.jpg";

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
      { property: "og:url", content: "https://youradviser.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://youradviser.lovable.app/" },
      { rel: "preload", as: "image", href: heroStudents, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "UniCompass",
          url: "https://youradviser.lovable.app/",
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
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
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
  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur"
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
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="rounded-lg px-4">
              Get Started
            </Button>
          </Link>
          <a
            href="#features"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
            aria-label="Browse features"
          >
            <Menu className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

const heroPoints = [
  "Personalized Recommendations",
  "Major Assessment",
  "Scholarship Finder",
];

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
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
            <Link to="/auth">
              <Button size="lg" className="h-12 rounded-xl px-7 text-base shadow-soft">
                Analyze My Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-border px-7 text-base"
              >
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
    <section id="features" className="border-y border-border bg-secondary/60">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
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
            <article
              key={f.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow duration-200 hover:shadow-elegant"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="mt-6">
                {f.to ? (
                  <Link to={f.to}>
                    <Button variant="outline" size="sm" className="rounded-lg border-border">
                      {f.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="rounded-lg border-border">
                      {f.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          How it works
        </h2>
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
  return (
    <section id="resources" className="border-y border-border bg-secondary/60">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Resources
            </h2>
            <p className="mt-4 text-muted-foreground">
              Plain-language explanations of how the process works, so every recommendation
              you receive makes sense.
            </p>
          </div>
          <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
            {resources.map((r) => (
              <div key={r.t} className="p-6">
                <h3 className="text-base font-semibold">{r.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="rounded-3xl border border-border bg-card px-8 py-14 text-center shadow-soft md:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Start with your profile
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Create an account, complete your profile once, and see where you stand. Free to
          start, no credit card required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="h-12 rounded-xl px-7 text-base">
              Analyze My Profile
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-border px-7 text-base">
              How It Works
            </Button>
          </a>
        </div>
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
              Personalized university, major and scholarship guidance for students planning
              their applications.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Platform</span>
              <a href="#features" className="text-muted-foreground hover:text-foreground">
                Find Universities
              </a>
              <Link to="/find-your-major" className="text-muted-foreground hover:text-foreground">
                Find Your Major
              </Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground">
                Scholarships
              </a>
            </nav>
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Company</span>
              <a href="#resources" className="text-muted-foreground hover:text-foreground">
                Resources
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </a>
              <DonateDialog>
                <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Heart className="h-3.5 w-3.5" /> Support us
                </button>
              </DonateDialog>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} UniCompass
        </div>
      </div>
    </footer>
  );
}
