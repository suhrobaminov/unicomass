import { Link } from "@tanstack/react-router";
import { Compass, Instagram, Send, Heart, ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonateDialog } from "@/components/donate-dialog";

export function AppFooter() {
  return <footer className="site-footer no-print">
    <div className="site-width grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1.2fr]">
      <div><Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold"><Compass className="size-6 text-shell-accent" />UniCompass</Link><p className="mt-4 max-w-xs text-sm leading-6 text-shell-muted">A clearer direction for your university journey.</p><p className="mt-6 text-xs text-shell-muted">© {new Date().getFullYear()} UniCompass</p></div>
      <nav aria-label="Footer navigation" className="flex flex-col items-start gap-3 text-sm"><p className="eyebrow mb-1 text-shell-muted">Your next chapter</p><Link to="/dashboard" className="footer-link">Find Universities <ArrowUpRight className="size-3.5" /></Link><Link to="/find-your-major" className="footer-link">Find Your Major <ArrowUpRight className="size-3.5" /></Link><Link to="/auth" className="footer-link">Sign in <ArrowUpRight className="size-3.5" /></Link><DonateDialog><Button variant="ghost" className="shell-ghost -ml-3"><Heart className="size-4" />Support UniCompass</Button></DonateDialog></nav>
      <div><p className="eyebrow text-shell-muted">Made with purpose</p><p className="mt-4 font-medium">Created by Suhrob Aminov</p><div className="mt-4 flex flex-col items-start gap-3 text-sm"><a href="https://t.me/Uzbek_npc" target="_blank" rel="noopener noreferrer" className="footer-link"><Send className="size-4" />Telegram: @Uzbek_npc</a><a href="https://instagram.com/Uzbek.npc" target="_blank" rel="noopener noreferrer" className="footer-link"><Instagram className="size-4" />Instagram: @Uzbek.npc</a><a href="mailto:suhrobaminov067@gmail.com" className="footer-link break-all"><Mail className="size-4 shrink-0" />suhrobaminov067@gmail.com</a></div></div>
    </div>
  </footer>;
}