import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Compass, GraduationCap, Menu, X, ArrowUpRight, Home, Wallet, BriefcaseBusiness, SearchCheck } from "lucide-react";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { if (!open) return; const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [open]);
  const links = <>
    <Link to="/" activeOptions={{ exact: true }} className="nav-link"><Home className="size-4" />Home</Link>
    <Link to="/dashboard" className="nav-link"><GraduationCap className="size-4" />Find Universities</Link>
    <Link to="/find-your-major" className="nav-link"><Compass className="size-4" />Find Your Major</Link>
    <Link to="/career-explorer" className="nav-link"><BriefcaseBusiness className="size-4" />Career Explorer</Link>
    <Link to="/cost-planner" className="nav-link"><Wallet className="size-4" />Cost Planner</Link>
    <Link to="/funding-research" className="nav-link"><SearchCheck className="size-4" />AI Funding Research</Link>
  </>;
  return <header className="site-header sticky top-0 z-40 no-print">
    <div className="site-width grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 lg:flex lg:justify-between">
      <Link to="/" className="flex min-w-0 items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-shell-border text-shell-accent"><Compass className="size-5" /></span><span className="truncate font-display text-xl font-semibold">UniCompass</span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">{links}</nav>
      <div className="flex shrink-0 items-center gap-2"><Button asChild variant="outline" className="shell-outline hidden sm:inline-flex"><Link to="/auth">Sign in <ArrowUpRight className="size-4" /></Link></Button><Button variant="ghost" size="icon" className="shell-ghost xl:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div>
    </div>
    {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="site-width border-t border-shell-border py-4 xl:hidden page-enter">{links}<Link to="/auth" className="nav-link">Sign in <ArrowUpRight className="size-4" /></Link></nav>}
  </header>;
}
