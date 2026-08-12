import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Heart, Compass, LayoutDashboard } from "lucide-react";
import { DonateDialog } from "@/components/donate-dialog";

export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40 no-print">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">u</div>
          <span className="font-display text-xl font-semibold">UniCompass</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 mr-1.5" />Dashboard</Button>
          </Link>
          <Link to="/find-your-major" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm"><Compass className="h-4 w-4 mr-1.5" />Find Your Major</Button>
          </Link>
          <DonateDialog>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent"><Heart className="h-4 w-4 mr-1.5" />Donate</Button>
          </DonateDialog>
        </div>
      </div>
    </header>
  );
}
