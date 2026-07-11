import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";

type Row = { id: string; created_at: string; payload: { profile_strength_score?: number } };

export function ReportsList() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("reports").select("id, created_at, payload").order("created_at", { ascending: false });
      setRows((data as Row[]) ?? []);
    })();
  }, []);

  if (rows === null) return <div className="grid place-items-center py-16"><Loader2 className="animate-spin" /></div>;
  if (rows.length === 0) return <Card className="p-10 text-center text-muted-foreground">No reports yet. Complete your profile and generate your first analysis.</Card>;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {rows.map((r) => (
        <Link key={r.id} to="/reports/$id" params={{ id: r.id }}>
          <Card className="p-5 hover:shadow-elegant transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center"><FileText className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="font-medium">Strategy report</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-semibold text-primary">{r.payload.profile_strength_score ?? "—"}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
