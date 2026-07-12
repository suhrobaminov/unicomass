import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, GraduationCap, ListChecks, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { CommunityFeedback } from "@/components/community-feedback";
import { DonateDialog } from "@/components/donate-dialog";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <CommunityFeedback />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">y</div>
          <span className="font-display text-xl font-semibold">youradviser</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a href="#community" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Community</Button></a>
          <DonateDialog>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
              <Heart className="h-4 w-4 mr-1.5" />Donate
            </Button>
          </DonateDialog>
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/dashboard"><Button size="sm">Get started</Button></Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-hero">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Veteran admissions officer, on demand
        </div>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
          Your college strategy,<br />
          <span className="text-primary">engineered.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Build your admissions profile once. Get a critical, holistic evaluation with a Reach / Target / Safety school list and a step-by-step roadmap to raise your odds.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 text-base shadow-elegant">
              Analyze my profile <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="ghost" className="h-12">See how it works</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Target, title: "Reach / Target / Safety", desc: "A calibrated school list with acceptance rate estimates and reasoning tied to your profile." },
    { icon: GraduationCap, title: "Profile strength score", desc: "A single 1–100 competitiveness score with an honest breakdown of your gaps." },
    { icon: ListChecks, title: "Actionable roadmap", desc: "4–5 chronological next steps. Not vague advice — concrete moves you can start this week." },
    { icon: ShieldCheck, title: "Private by design", desc: "Your profile is encrypted and only you can see your reports. Delete anytime." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <it.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Build your profile", d: "Four guided steps: demographics, academics, activities, and awards. Progress saves automatically." },
    { n: "02", t: "Generate your report", d: "Our AI, prompted as an ivy-league admissions officer, evaluates your profile holistically." },
    { n: "03", t: "Execute the roadmap", d: "Work through your personalized checklist. Re-run anytime as your profile evolves." },
  ];
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl md:text-5xl font-semibold">How it works</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="font-display text-5xl text-accent">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <h2 className="font-display text-4xl md:text-5xl font-semibold">Ready to see where you stand?</h2>
      <p className="mt-4 text-muted-foreground">Free to start. No credit card required.</p>
      <Link to="/auth" className="inline-block mt-8">
        <Button size="lg" className="h-12 px-8 shadow-elegant">Analyze my profile</Button>
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} youradviser</span>
        <div className="flex items-center gap-4">
          <a href="#community" className="hover:text-foreground">Community</a>
          <DonateDialog>
            <button className="inline-flex items-center gap-1.5 text-accent hover:opacity-80">
              <Heart className="h-3.5 w-3.5" /> Support us
            </button>
          </DonateDialog>
          <span>Built for ambitious students.</span>
        </div>
      </div>
    </footer>
  );
}
