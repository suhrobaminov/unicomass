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
    <div className="uc-site min-h-screen bg-[#11120f] text-[#f2efe5]">
      <style>{`
        @keyframes uc-button-breathe { 0%,100% { box-shadow:0 0 0 rgba(195,169,119,0), 0 0 0 1px rgba(195,169,119,.2); } 50% { box-shadow:0 0 18px rgba(195,169,119,.12), 0 0 0 1px rgba(195,169,119,.42); } }
        @keyframes uc-sparkle { 0% { opacity:0; transform:translate(0,8px) scale(.35) rotate(0deg); } 35% { opacity:1; } 100% { opacity:0; transform:translate(var(--spark-x),-22px) scale(1.1) rotate(70deg); } }
        .uc-site button, .uc-site a[role="button"], .uc-site [data-slot="button"] { position:relative; isolation:isolate; overflow:hidden; transition:color .25s ease,background-color .25s ease,border-color .25s ease,box-shadow .25s ease,transform .25s ease; }
        .uc-site button:not(:disabled):hover, .uc-site a[role="button"]:hover, .uc-site [data-slot="button"]:hover { box-shadow:0 0 22px rgba(195,169,119,.22),0 0 48px rgba(195,169,119,.08); border-color:rgba(215,190,133,.9); transform:translateY(-1px); }
        .uc-site button:not(:disabled):hover::after, .uc-site a[role="button"]:hover::after, .uc-site [data-slot="button"]:hover::after { content:"✦"; position:absolute; z-index:3; pointer-events:none; top:4px; right:9px; color:#f6e7b9; font-size:12px; text-shadow:0 0 8px #c3a977,0 0 18px #c3a977; animation:uc-sparkle .75s ease-out both; --spark-x:8px; }
        .uc-site button:not(:disabled):active, .uc-site a[role="button"]:active, .uc-site [data-slot="button"]:active { transform:translateY(0) scale(.985); }
        .uc-site a, .uc-site button { cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M16 1.5 19.7 11l9.8 5-9.8 4-3.7 10-3.8-10-9.7-4 9.7-5z' fill='%23c3a977' stroke='%23f2efe5' stroke-width='1.4'/%3E%3C/svg%3E") 16 16,pointer; }
        .uc-site :focus-visible { outline:2px solid #d6bd80 !important; outline-offset:4px; }
        @media (prefers-reduced-motion:reduce) { .uc-site button,.uc-site a,.uc-site button::after,.uc-site a::after { animation:none !important; transition:none !important; } }
      `}</style>
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
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[#c3a977]-foreground">
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
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#b9b7ac] transition-colors hover:bg-[#171813] hover:text-[#f2efe5]"
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
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#39382f] text-[#b9b7ac] lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="mobile-navigation" className="border-t border-[#39382f] bg-[#11120f] px-6 py-3 lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-[#b9b7ac] hover:bg-[#171813] hover:text-[#f2efe5]"
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
          <span className="inline-flex items-center gap-2 rounded-full border border-[#39382f] bg-[#171813] px-3 py-1 text-xs font-medium text-[#b9b7ac]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            University admissions guidance
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Find Your Perfect University.
            <br />
            <span className="text-[#c3a977]">One Profile. Smarter Decisions.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#b9b7ac] md:text-lg">
            Build your academic profile once and receive personalized university
            recommendations, scholarship matches, major suggestions, and a clear
            application roadmap.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <LoginDialog>
              <Button size="lg" className="uc-primary-button h-12 rounded-xl border border-[#32d583] bg-[#22b96a] px-7 text-base text-[#07180f] shadow-[0_0_22px_rgba(34,185,106,.18)] hover:bg-[#45e08c] hover:text-[#07180f]">
                Analyze My Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </LoginDialog>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 rounded-xl border-[#756744] bg-[#1c1d18] px-7 text-base text-[#f2efe5] hover:bg-[#292a23] hover:text-[#f2efe5]">
                How It Works
              </Button>
            </a>
          </div>
          <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {heroPoints.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2a2b22] text-[#d8c394]">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto flex min-h-[400px] w-full max-w-[540px] items-center justify-center overflow-hidden rounded-[2rem] border border-[#39382f] bg-[#171813] p-8 md:min-h-[500px]">
          <style>{`
            @keyframes compass-orbit { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            @keyframes compass-counter { from { transform:rotate(0deg); } to { transform:rotate(-360deg); } }
            @keyframes compass-pulse { 0%,100% { transform:scale(.96); opacity:.45; } 50% { transform:scale(1.04); opacity:.85; } }
            @keyframes compass-drift { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
            @keyframes compass-sweep { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            .compass-orbit { animation:compass-orbit 28s linear infinite; transform-origin:center; }
            .compass-counter { animation:compass-counter 36s linear infinite; transform-origin:center; }
            .compass-pulse { animation:compass-pulse 5s ease-in-out infinite; }
            .compass-drift { animation:compass-drift 6s ease-in-out infinite; }
            .compass-sweep { transform-origin:center; animation:compass-sweep 12s linear infinite; }
            @media (prefers-reduced-motion:reduce) { .compass-orbit,.compass-counter,.compass-pulse,.compass-drift,.compass-sweep { animation:none !important; } }
          `}</style>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(195,169,119,.13),transparent_58%)]"/>
          <div className="pointer-events-none absolute inset-0 opacity-[.12]" style={{backgroundImage:"linear-gradient(rgba(195,169,119,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(195,169,119,.22) 1px, transparent 1px)",backgroundSize:"42px 42px"}}/>
          <div className="absolute left-6 top-6 text-[10px] uppercase tracking-[.22em] text-[#a9a797]">Your journey / mapped</div>
          <div className="absolute right-6 top-6 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#c3a977]"><span className="h-1.5 w-1.5 rounded-full bg-[#c3a977] shadow-[0_0_12px_#c3a977]"/> In progress</div>
          <div className="relative aspect-square w-full max-w-[360px]">
            <div className="compass-pulse absolute inset-[14%] rounded-full border border-[#c3a977]/25 shadow-[0_0_65px_rgba(195,169,119,.08)]"/>
            <div className="absolute inset-[4%] rounded-full border border-dashed border-[#77715b]/60"/>
            <div className="compass-orbit absolute inset-[8%] rounded-full border border-[#c3a977]/45">
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#d9c28f] shadow-[0_0_18px_#c3a977]"/>
              <span className="absolute bottom-[14%] left-[4%] h-2 w-2 rounded-full bg-[#6f9f83] shadow-[0_0_14px_#6f9f83]"/>
            </div>
            <div className="compass-counter absolute inset-[24%] rounded-full border border-[#657d68]/50">
              <span className="absolute right-[8%] top-[15%] h-2.5 w-2.5 rounded-full bg-[#8cb89a] shadow-[0_0_16px_#8cb89a]"/>
            </div>
            <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs><linearGradient id="compassGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0dfb2"/><stop offset="100%" stopColor="#9a7e48"/></linearGradient></defs>
              <circle cx="160" cy="160" r="90" fill="none" stroke="#c3a977" strokeOpacity=".18"/>
              <circle cx="160" cy="160" r="68" fill="none" stroke="#c3a977" strokeOpacity=".24" strokeDasharray="2 7"/>
              <g className="compass-sweep"><path d="M160 160 L160 35 A125 125 0 0 1 249 72 Z" fill="#c3a977" fillOpacity=".055"/><line x1="160" y1="160" x2="160" y2="30" stroke="#c3a977" strokeOpacity=".42"/></g>
              <path d="M160 82 L183 151 L160 139 L137 151 Z" fill="url(#compassGold)"/>
              <path d="M160 238 L137 169 L160 181 L183 169 Z" fill="#668d72"/>
              <circle cx="160" cy="160" r="7" fill="#f2efe5"/><circle cx="160" cy="160" r="13" fill="none" stroke="#c3a977" strokeOpacity=".8"/>
              <g fill="#c9c1ac" fontSize="9" letterSpacing="3"><text x="160" y="20" textAnchor="middle">N</text><text x="301" y="163" textAnchor="middle">E</text><text x="160" y="311" textAnchor="middle">S</text><text x="19" y="163" textAnchor="middle">W</text></g>
            </svg>
            <div className="compass-drift absolute -left-4 top-[24%] border border-[#39382f] bg-[#20211b]/95 px-4 py-3 shadow-xl backdrop-blur">
              <p className="text-[9px] uppercase tracking-[.18em] text-[#a9a797]">Your direction</p><p className="mt-1 font-serif text-sm text-[#f2efe5]">Computer science</p>
            </div>
            <div className="compass-drift absolute -right-5 bottom-[18%] border border-[#39382f] bg-[#20211b]/95 px-4 py-3 shadow-xl backdrop-blur" style={{animationDelay:"-3s"}}>
              <p className="text-[9px] uppercase tracking-[.18em] text-[#a9a797]">Next milestone</p><p className="mt-1 font-serif text-sm text-[#c3a977]">Build your shortlist ↗</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between border-t border-[#39382f] pt-4 text-[9px] uppercase tracking-[.18em] text-[#858477]"><span>Ambition into direction</span><span>41° 18' N / 69° 16' E</span></div>
        </div>
      </div>
    </section>
  );
}

function StudyExperience() {
  return (
    <section className="journal-section relative overflow-hidden border-y border-[#34342e] bg-[#11120f] text-[#f2efe5]">
      <style>{`
        @keyframes journal-rise { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes journal-page-turn { 0%,18% { transform:rotateY(0deg); } 38%,58% { transform:rotateY(-24deg); } 78%,100% { transform:rotateY(0deg); } }
        @keyframes journal-page-glint { 0%,20% { opacity:0; transform:translateX(-130%); } 55% { opacity:.8; } 80%,100% { opacity:0; transform:translateX(130%); } }
        @keyframes journal-lamp { 0%,100% { opacity:.35; } 50% { opacity:.7; } }
        @keyframes journal-float { 0%,100% { transform:translateY(0) rotate(-.5deg); } 50% { transform:translateY(-5px) rotate(.3deg); } }
        .journal-reveal { animation:journal-rise .8s cubic-bezier(.2,.75,.25,1) both; }
        .journal-book { animation:journal-float 8s ease-in-out infinite; transform-style:preserve-3d; }
        .journal-page { transform-origin:left center; transform-style:preserve-3d; animation:journal-page-turn 9s cubic-bezier(.65,0,.35,1) infinite; backface-visibility:hidden; }
        .journal-glint { animation:journal-page-glint 9s ease-in-out infinite; }
        .journal-lamp { animation:journal-lamp 6s ease-in-out infinite; }
        .journal-rule { transform-origin:left; animation:journal-rise 1s .2s ease-out both; }
        @media (prefers-reduced-motion:reduce) { .journal-reveal,.journal-book,.journal-page,.journal-glint,.journal-lamp,.journal-rule { animation:none !important; } }
      `}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[.9fr_1.1fr]">
        <div className="journal-reveal relative z-10">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.24em] text-[#c3a977]"><span className="h-px w-8 bg-[#c3a977]"/> The UniCompass journal / 01</p>
          <h2 className="mt-7 max-w-xl font-serif text-4xl font-medium leading-[1.04] tracking-[-.04em] sm:text-5xl md:text-6xl">Every future<br/>starts with a<br/><em className="font-normal text-[#c3a977]">first page.</em></h2>
          <div className="journal-rule mt-7 h-px w-28 bg-[#c3a977]"/>
          <p className="mt-6 max-w-md text-base leading-7 text-[#b9b7ac]">The path to university isn't a template. It's a story shaped by your ambition, your choices, and the work you put in next.</p>
          <div className="mt-8 flex items-center gap-4 text-xs uppercase tracking-[.16em] text-[#c3c0b4]"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#555348] font-serif text-sm text-[#d5bd8d]">01</span><span>Discover your direction</span></div>
        </div>
        <div className="journal-reveal relative mx-auto w-full max-w-[510px]" style={{animationDelay:".15s"}}>
          <div className="journal-lamp absolute -inset-8 rounded-full bg-[#c3a977]/10 blur-3xl"/>
          <div className="absolute -right-1 top-0 z-20 border border-[#4a493e] bg-[#191a16] px-4 py-3 shadow-xl"><p className="text-[9px] uppercase tracking-[.22em] text-[#b9a16f]">Field notes / 2026</p><p className="mt-1 font-serif text-sm italic text-[#f2efe5]">Make room for possibility.</p></div>
          <div className="journal-book relative mx-auto mt-8 h-[285px] w-[min(100%,430px)] [perspective:1600px] sm:h-[330px]">
            <div className="absolute inset-y-3 left-2 right-0 rounded-r-md bg-[#403728] shadow-2xl shadow-black/50"/>
            <div className="absolute inset-y-0 left-0 right-1 grid grid-cols-2 overflow-hidden border border-[#c9c0a8]/25 bg-[#e9e1cf] text-[#25241f] shadow-2xl">
              <div className="border-r border-[#c5bba6] px-5 py-6 sm:px-7 sm:py-8"><p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">Chapter one</p><h3 className="mt-4 font-serif text-2xl leading-tight sm:text-3xl">Find your<br/><em>north.</em></h3><p className="mt-4 text-[10px] leading-5 text-[#696456]">Start with what matters to you. Let curiosity do the rest.</p><div className="mt-5 space-y-2">{[88,72,82,54].map((w,i)=><div key={i} className="h-px bg-[#aaa18f]" style={{width:w+"%"}}/>)}</div><p className="mt-6 font-serif text-xs italic text-[#786a50]">A map is only the beginning.</p></div>
              <div className="px-5 py-6 sm:px-7 sm:py-8"><p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">Your next steps</p><div className="mt-5 space-y-5">{["Know your strengths","Explore your options","Build your plan"].map((s,i)=><div key={s} className="flex gap-3"><span className="font-serif text-xs italic text-[#9b8050]">0{i+1}</span><div><p className="font-serif text-sm">{s}</p><div className="mt-2 h-px w-16 bg-[#b9ae98]"/></div></div>)}</div><div className="mt-7 border-t border-[#c5bba6] pt-4"><p className="text-[9px] uppercase tracking-[.18em] text-[#7b6b4e]">A note to self</p><p className="mt-2 font-serif text-sm italic">Keep going, even when the way isn't clear.</p></div></div>
            </div>
            <div className="journal-page absolute inset-y-0 left-0 right-1 overflow-hidden border border-[#c9c0a8] bg-[#f3ecdc] px-5 py-6 text-[#25241f] shadow-lg sm:px-7 sm:py-8"><p className="text-[9px] uppercase tracking-[.2em] text-[#7b6b4e]">A letter to your future self</p><h3 className="mt-5 font-serif text-2xl leading-tight sm:text-3xl">The next chapter<br/><em>is yours to write.</em></h3><p className="mt-4 max-w-[260px] font-serif text-sm leading-6 text-[#696456]">A little clarity today can change the choices you make tomorrow.</p><div className="mt-5 space-y-3">{[94,82,89,65,78].map((w,i)=><div key={i} className="h-px bg-[#b9ae98]" style={{width:w+"%"}}/>)}</div><p className="mt-7 font-serif text-xs italic text-[#8a744f]">UniCompass — notes for the road ahead</p><div className="journal-glint pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"/></div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#3b3b32] pt-4 text-[10px] uppercase tracking-[.18em] text-[#858477]"><span>Personal direction, not a preset path</span><span>01 — 03</span></div>
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
    <div className="mx-auto -mt-16 w-[min(100%,22rem)] rounded-2xl border border-[#39382f] bg-[#1c1d18] p-5 shadow-elegant sm:mx-0 lg:absolute lg:-bottom-10 lg:-left-10 lg:mt-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#b9b7ac]">Profile Strength</span>
        <span className="text-sm font-semibold tabular-nums text-[#c3a977]">86%</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#171813]">
        <div className="h-full w-[86%] rounded-full bg-primary" />
      </div>
      <dl className="mt-5 space-y-3 border-t border-[#39382f] pt-4">
        {dashboardRows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-[#b9b7ac]">{r.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-[#b9b7ac]">Illustrative preview of your dashboard.</p>
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
      <div className="mx-auto max-w-6xl px-6 py-16 text-[#f2efe5] md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to apply with confidence
          </h2>
          <p className="mt-4 text-[#b9b7ac]">
            Each tool works from the same profile, so your recommendations stay consistent
            across universities, majors, scholarships and deadlines.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="flex flex-col rounded-2xl border border-[#39382f] bg-[#1c1d18] p-6 shadow-[0_12px_40px_rgba(0,0,0,.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#756744] hover:shadow-[0_18px_55px_rgba(0,0,0,.32)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2a2b22] text-[#d8c394]">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#b9b7ac]">{f.desc}</p>
              <div className="mt-6">
                {f.to ? (
                  <Link to={f.to}>
                    <Button variant="outline" size="sm" className="rounded-lg border-[#756744] bg-[#1c1d18] text-[#f2efe5] hover:bg-[#292a23] hover:text-[#f2efe5]">
                      {f.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-lg border-[#5c594b] bg-transparent text-[#e9e1cf] hover:bg-[#292a23] hover:text-[#f2efe5]">
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
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 text-[#f2efe5] md:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
        <p className="mt-4 text-[#b9b7ac]">
          Three steps, one profile. No forms to repeat and no guesswork about what to do next.
        </p>
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((s) => (
          <div key={s.n} className="border-t border-[#39382f] pt-6">
            <span className="text-sm font-semibold tabular-nums text-[#c3a977]">{s.n}</span>
            <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#b9b7ac]">{s.d}</p>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-[#39382f] bg-[#11120f] px-3 py-1 text-xs font-medium text-[#b9b7ac]">
              <Lightbulb className="h-3.5 w-3.5" /> Built with student feedback
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">Resources & feedback</h2>
            <p className="mt-4 text-[#b9b7ac]">
              Explore practical guidance and help us improve UniCompass. Tell us what is missing, confusing, or worth building next.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#39382f] bg-[#1c1d18] p-4">
              <MessageSquareText className="mt-0.5 h-5 w-5 text-[#c3a977]" />
              <div>
                <p className="font-medium">Your input shapes the roadmap</p>
                <p className="mt-1 text-sm text-[#b9b7ac]">Suggestions are reviewed by the UniCompass team and may inform future improvements. No email address or account is required. Please do not include sensitive personal information.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="divide-y divide-[#39382f] rounded-2xl border border-[#39382f] bg-[#1c1d18] shadow-soft">
              {resources.map((r) => (
                <div key={r.t} className="p-6">
                  <h3 className="text-base font-semibold">{r.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#b9b7ac]">{r.d}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submitSuggestion} className="rounded-2xl border border-[#39382f] bg-[#1c1d18] p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2a2b22] text-[#d8c394]"><Send className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold">Share a suggestion</h3>
                  <p className="text-sm text-[#b9b7ac]">No email or sign-in required.</p>
                </div>
              </div>
              <label htmlFor="feedback-category" className="mt-5 block text-sm font-medium">Feedback category</label>
              <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 flex h-10 w-full rounded-md border border-[#454438] bg-[#11120f] px-3 py-2 text-sm">
                <option>Product suggestion</option>
                <option>Bug or technical issue</option>
                <option>University or scholarship data</option>
                <option>Design and usability</option>
                <option>Other feedback</option>
              </select>
              <label htmlFor="feedback-message" className="mt-4 block text-sm font-medium">Your suggestion</label>
              <textarea id="feedback-message" value={suggestion} onChange={(event) => { setSuggestion(event.target.value); if (status !== "sending") setStatus("idle"); }} required minLength={10} maxLength={3000} rows={5} placeholder="Tell us what would make UniCompass more useful..." className="mt-2 w-full resize-y rounded-md border border-[#454438] bg-[#11120f] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button type="submit" disabled={status === "sending"} className="mt-5 w-full rounded-lg">
                <Send className="mr-2 h-4 w-4" /> {status === "sending" ? "Submitting..." : "Submit suggestion"}
              </Button>
              {status === "success" && <p role="status" className="mt-3 text-sm text-[#8cb89a]">Thanks — your suggestion was submitted successfully.</p>}
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
    <section id="contact" className="relative overflow-hidden bg-[#11120f] px-6 py-20 text-[#f2efe5] md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(80%,900px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c3a977]/70 to-transparent"/>
      <div className="mx-auto grid max-w-6xl gap-10 border border-[#39382f] bg-[#171813] p-7 sm:p-10 md:grid-cols-[1fr_auto] md:items-end md:p-14">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#c3a977]">A note to the creator</p>
          <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">Good journeys begin<br/><em className="font-normal text-[#c3a977]">with a conversation.</em></h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#b9b7ac] md:text-base">Questions, ideas, or something we should improve? Reach out directly. Every thoughtful note helps make UniCompass better.</p>
          <p className="mt-7 text-xs uppercase tracking-[.16em] text-[#858477]">Created by Suhrob Aminov · UniCompass</p>
        </div>
        <div className="flex flex-wrap gap-3 md:max-w-[210px] md:flex-col">
          <a href="mailto:suhrobaminov067@gmail.com" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#c3a977] bg-[#c3a977] px-5 text-sm font-semibold text-[#171813] transition-colors hover:bg-[#d6c394]"><MessageSquareText className="h-4 w-4"/> Email me <ArrowRight className="h-4 w-4"/></a>
          <a href="https://t.me/Uzbek_npc" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#48473c] px-5 text-sm font-medium text-[#f2efe5] transition-colors hover:border-[#c3a977] hover:text-[#d6c394]"><Send className="h-4 w-4"/> Telegram</a>
          <a href="https://www.instagram.com/Uzbek.npc/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#48473c] px-5 text-sm font-medium text-[#f2efe5] transition-colors hover:border-[#c3a977] hover:text-[#d6c394]">Instagram <ArrowRight className="h-4 w-4"/></a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#34342e] bg-[#0b0c0a] text-[#f2efe5]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-[#b9b7ac]">
              Personalized university, major and scholarship guidance for students planning their applications.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Platform</span>
              <a href="#features" className="text-[#b9b7ac] hover:text-[#f2efe5]">Find Universities</a>
              <Link to="/find-your-major" className="text-[#b9b7ac] hover:text-[#f2efe5]">Find Your Major</Link>
              <a href="#features" className="text-[#b9b7ac] hover:text-[#f2efe5]">Scholarships</a>
            </nav>
            <nav className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Company</span>
              <a href="#resources" className="text-[#b9b7ac] hover:text-[#f2efe5]">Resources</a>
              <a href="#contact" className="text-[#b9b7ac] hover:text-[#f2efe5]">Contact</a>
              <DonateDialog>
                <button className="inline-flex items-center gap-1.5 text-[#b9b7ac] hover:text-[#f2efe5]">
                  <Heart className="h-3.5 w-3.5" /> Support us
                </button>
              </DonateDialog>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-[#39382f] pt-6 text-sm text-[#b9b7ac]">© {new Date().getFullYear()} UniCompass</div>
      </div>
    </footer>
  );
}
