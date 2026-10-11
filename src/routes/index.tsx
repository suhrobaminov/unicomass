import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Compass, GraduationCap, ArrowRight, ArrowUpRight, Check, FileText, Send, Loader2, Map, ShieldCheck } from "lucide-react";
import { LoginDialog } from "@/components/login-dialog";
import heroStudents from "@/assets/hero-students.jpg";
import { absoluteUrl } from "@/lib/site";
import { feedbackClient } from "@/lib/feedback-client";

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
  return <main>
    <section className="hero-scene">
      <img src={heroStudents} alt="Students on a university campus" className="hero-image" fetchPriority="high" />
      <div className="site-width hero-content">
        <div className="max-w-xl page-enter"><p className="eyebrow flex items-center gap-2 text-shell-accent"><span className="h-px w-6 bg-shell-accent" />Your future, with direction</p>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.08] sm:text-6xl">UniCompass<span className="mt-4 block text-3xl font-normal leading-tight sm:text-4xl">The next chapter<br />starts with you.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-shell-muted">Find universities that fit your ambitions. Discover a major that feels like you. Turn your profile into a plan.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/dashboard">Find Universities <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="shell-outline"><Link to="/find-your-major">Find Your Major <Compass /></Link></Button></div>
          <div className="mt-8 flex items-center gap-2 text-xs text-shell-muted"><ShieldCheck className="size-4 text-shell-accent" />Your progress stays on your device. An account is optional.</div>
        </div>
      </div>
    </section>
    <section className="site-width py-16 sm:py-20">
      <div className="reveal grid gap-6 md:grid-cols-[1fr_1fr] md:items-end"><div><p className="eyebrow text-primary">Less guesswork. More direction.</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Big decisions.<br />Clearer next steps.</h2></div><p className="max-w-lg text-sm leading-7 text-muted-foreground">Your interests and achievements are the starting point. Explore your options with guidance grounded in the profile you actually have.</p></div>
      <div className="stagger mt-10 grid gap-5 md:grid-cols-3">
        {[{n:"01", icon:GraduationCap, title:"Find your universities", text:"Build your academic profile for a personalized Reach, Target, and Safety shortlist.", to:"/dashboard" as const, cta:"Build my shortlist"},{n:"02", icon:Compass, title:"Discover your major", text:"Explore how your interests and strengths align with 20 university majors.", to:"/find-your-major" as const, cta:"Take the assessment"},{n:"03", icon:Map, title:"Make your next move", text:"Review profile gaps and practical next steps in your saved admissions reports.", to:"/dashboard" as const, cta:"Open my workspace"}].map(x => <article key={x.n} className="reveal card-lift rounded-lg border bg-card p-7"><div className="flex items-center justify-between"><x.icon className="size-6 text-primary" /><span className="feature-number">{x.n}</span></div><h3 className="mt-8 text-xl font-semibold">{x.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{x.text}</p><Button asChild variant="link" className="mt-5 -ml-4"><Link to={x.to}>{x.cta}<ArrowUpRight /></Link></Button></article>)}
      </div>
    </section>
    <section className="border-y bg-card"><div className="site-width grid gap-10 py-16 md:grid-cols-[1fr_1.2fr] sm:py-20"><div className="reveal"><p className="eyebrow text-primary">A balanced university list</p><h2 className="mt-3 text-3xl font-semibold">Ambition meets<br />a thoughtful strategy.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Your admissions report considers academics, extracurriculars, awards, and intended fields. Each recommendation includes a rationale and an assessment.</p><Button asChild className="mt-7"><Link to="/dashboard">Analyze my profile <ArrowRight /></Link></Button></div><div className="reveal space-y-6">{[{t:"Reach", c:"tier-reach", d:"Ambitious options where admission is more competitive for your profile."},{t:"Target", c:"tier-target", d:"Universities that align well with your academic profile and goals."},{t:"Safety", c:"tier-safety", d:"More accessible options to help balance your shortlist. No admission is guaranteed."}].map(x => <div key={x.t} className="grid grid-cols-[84px_minmax(0,1fr)] gap-5 border-b pb-6 last:border-0"><span className={"self-start rounded-md border px-3 py-2 text-center text-xs font-medium " + x.c}>{x.t}</span><p className="text-sm leading-7 text-muted-foreground">{x.d}</p></div>)}<p className="text-xs leading-6 text-muted-foreground">AI guidance is not an admissions decision. Verify requirements and deadlines with each university.</p></div></div></section>
    <section className="site-width py-16 sm:py-20"><div className="reveal flex flex-col gap-4"><p className="eyebrow text-primary">From profile to plan</p><h2 className="text-3xl font-semibold">A little clarity goes a long way.</h2></div><div className="stagger mt-10 grid gap-10 md:grid-cols-3">{[{n:"01", t:"Tell your story", d:"Add your academics, activities, awards, and goals in four guided steps."},{n:"02", t:"Explore your fit", d:"Generate real recommendations or complete the 30-question major assessment."},{n:"03", t:"Keep moving forward", d:"Revisit your report, work through your roadmap, and export a PDF."}].map(x => <div key={x.n} className="reveal border-t pt-5"><p className="text-sm text-primary">{x.n}</p><h3 className="mt-4 text-lg font-semibold">{x.t}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{x.d}</p></div>)}</div></section>
    <Feedback />
    <section className="page-heading"><div className="site-width grid gap-6 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="reveal"><p className="eyebrow text-shell-accent">Your journey. Your pace.</p><h2 className="mt-4 text-3xl font-semibold">Make room for possibility.</h2><p className="mt-3 text-sm text-shell-muted">Start with your profile. Let your next step become clearer.</p></div><div className="flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/dashboard">Start my profile<ArrowRight /></Link></Button><LoginDialog><Button variant="outline" size="lg" className="shell-outline">Sign in</Button></LoginDialog></div></div></section>
  </main>;
}

function Feedback() {
  const [category, setCategory] = useState("Product suggestion");
  const [suggestion, setSuggestion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); setError("");
    try {
      const { error } = await feedbackClient.from("site_feedback").insert({ category, message: suggestion.trim() });
      if (error) throw error;
      setSuggestion(""); setStatus("success");
    } catch { setStatus("error"); setError("Your suggestion could not be sent. Please try again later, or contact Suhrob using the links below."); }
  }
  return <section className="border-t bg-secondary/50"><div className="site-width grid gap-10 py-16 md:grid-cols-2 sm:py-20"><div className="reveal"><p className="eyebrow text-primary">Built with student feedback</p><h2 className="mt-4 text-3xl font-semibold">A better compass,<br />one conversation at a time.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Tell us what's missing, confusing, or worth improving. No email address or account is required.</p><p className="mt-5 max-w-sm text-xs leading-6 text-muted-foreground">Please don't include sensitive personal information.</p></div><form onSubmit={submit} className="reveal space-y-4"><label className="block text-sm font-medium" htmlFor="feedback-category">Feedback category</label><Select value={category} onValueChange={setCategory}><SelectTrigger id="feedback-category" className="bg-card"><SelectValue /></SelectTrigger><SelectContent>{["Product suggestion","Bug or technical issue","University or scholarship data","Design and usability","Other feedback"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select><label htmlFor="feedback-message" className="block text-sm font-medium">Your suggestion</label><Textarea id="feedback-message" className="bg-card" required minLength={10} maxLength={3000} rows={5} placeholder="What would make UniCompass more useful?" value={suggestion} onChange={e => { setSuggestion(e.target.value); setStatus("idle"); }} /><Button type="submit" disabled={status === "sending"}>{status === "sending" ? <Loader2 className="animate-spin" /> : <Send />} {status === "sending" ? "Sending…" : "Send suggestion"}</Button>{status === "success" && <p role="status" className="text-sm text-primary">Thank you. Your suggestion has been received.</p>}{status === "error" && <p role="alert" className="text-sm text-destructive">{error}</p>}</form></div></section>;
}
