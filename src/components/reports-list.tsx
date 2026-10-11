import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadStore, type SavedReport } from "@/lib/local-store";

export function ReportsList() {
  const [rows, setRows] = useState<SavedReport[] | null>(null);

  useEffect(() => {
    setRows(loadStore().reports);
  }, []);

  if (rows === null) return <div role="status" aria-label="Loading saved reports" className="space-y-4 py-8"><div className="loading-sheen h-20 w-full" /><div className="loading-sheen h-20 w-full" /><Loader2 className="sr-only animate-spin" /></div>;
  if (rows.length === 0) return <Card className="page-enter flex flex-col items-center p-8 text-center sm:p-12"><span className="grid size-14 place-items-center rounded-full bg-accent text-primary"><FileText className="size-6" /></span><h3 className="mt-5 font-display text-xl font-semibold text-foreground">Your strategy reports will live here</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Complete your academic profile to build a personalized Reach, Target, and Safety shortlist with practical next steps.</p><Button asChild className="mt-6"><Link to="/dashboard">Build my profile <ArrowRight className="ml-2 size-4" /></Link></Button></Card>;

  return (
    <div className="stagger grid gap-4 md:grid-cols-2">
      {rows.map((r) => (
        <Link key={r.id} to="/reports/$id" params={{ id: r.id }}>
          <Card className="card-lift p-5 transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center"><FileText className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="font-medium">Strategy report</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-semibold tabular-nums text-primary">
                  {(r.payload as { profile_strength_score?: number }).profile_strength_score ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
