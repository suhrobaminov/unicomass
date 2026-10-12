import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { feedbackClient } from "@/lib/feedback-client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, Users, MessageSquare, LogOut } from "lucide-react";

const ADMIN_EMAIL = "suhrobaminov067@gmail.com";

type Feedback = { id: number; category: string; message: string; created_at: string };
type Profile = { user_id: string; full_name: string | null; region: string | null; sat_score: number | null; act_score: number | null; gpa_unweighted: number | null; gpa_weighted: number | null; graduation_year: number | null; intended_majors: string | null; created_at: string; updated_at: string };

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — UniCompass" }, { name: "description", content: "Private UniCompass administration and feedback inbox." }, { property: "og:title", content: "Administration — UniCompass" }, { property: "og:description", content: "Private UniCompass administration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileTotal, setProfileTotal] = useState(0);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [profileResult, feedbackResult] = await Promise.all([
      supabase.from("profiles").select("user_id,full_name,region,sat_score,act_score,gpa_unweighted,gpa_weighted,graduation_year,intended_majors,created_at,updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(500),
      feedbackClient.from("site_feedback").select("id,category,message,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    const errs: string[] = [];
    if (profileResult.error) errs.push(`Profiles: ${profileResult.error.message}`);
    else { setProfiles((profileResult.data || []) as Profile[]); setProfileTotal(profileResult.count ?? profileResult.data?.length ?? 0); }
    if (feedbackResult.error) errs.push(`Feedback: ${feedbackResult.error.message}`);
    else setFeedback((feedbackResult.data || []) as Feedback[]);
    if (errs.length) setError(errs.join(" · "));
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!alive) return;
      const userEmail = data.user?.email || "";
      setEmail(userEmail);
      setAuthorized(!authError && userEmail.toLowerCase() === ADMIN_EMAIL);
      setChecking(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (authorized) void loadData(); }, [authorized, loadData]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (checking) return <main className="grid min-h-[65vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!authorized) return <main className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-6 text-center"><ShieldAlert className="h-12 w-12 text-destructive" /><h1 className="mt-4 text-2xl font-semibold">Admin access only</h1><p className="mt-2 text-muted-foreground">Sign in with the authorized UniCompass administrator account.</p><div className="mt-6 flex gap-3"><Link to="/auth"><Button>Sign in</Button></Link><Link to="/"><Button variant="outline">Home</Button></Link></div></main>;

  return <main className="min-h-[65vh] bg-background px-4 py-8 md:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm text-muted-foreground">UniCompass / private</p><h1 className="font-display text-3xl font-semibold">Admin panel</h1><p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />Refresh</Button><Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div></header>
    {error && <div role="alert" className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">Could not load all data: {error}. Check that the admin database migration has been applied.</div>}
    <div className="mb-8 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4"/>Profiles</div><p className="mt-2 text-3xl font-semibold">{profileTotal}</p><p className="text-xs text-muted-foreground">Saved to accounts (signed-in users only)</p></div><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-4 w-4"/>Feedback submissions</div><p className="mt-2 text-3xl font-semibold">{feedback.length}</p><p className="text-xs text-muted-foreground">Submissions available (up to 500)</p></div></div>
    <section className="mb-8 overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">User profiles</h2><p className="mt-1 text-sm text-muted-foreground">Academic details users have saved to their profiles. Emails and authentication credentials are not exposed here.</p></div>{profiles.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No profiles saved to accounts yet. Profiles are stored in the database only for signed-in users; guests keep their profile on their own device.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-secondary/60"><tr>{["Name","Region","SAT","ACT","GPA","Graduation","Intended major","Updated"].map(x=><th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{profiles.map(p=><tr key={p.user_id} className="border-t border-border"><td className="px-4 py-3"><div className="font-medium">{p.full_name || "Not provided"}</div><div className="max-w-40 truncate text-xs text-muted-foreground" title={p.user_id}>{p.user_id}</div></td><td className="px-4 py-3">{p.region || "—"}</td><td className="px-4 py-3">{p.sat_score ?? "—"}</td><td className="px-4 py-3">{p.act_score ?? "—"}</td><td className="px-4 py-3">{p.gpa_unweighted ?? p.gpa_weighted ?? "—"}</td><td className="px-4 py-3">{p.graduation_year ?? "—"}</td><td className="px-4 py-3">{p.intended_majors || "—"}</td><td className="px-4 py-3">{new Date(p.updated_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>
    <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">Feedback inbox</h2><p className="mt-1 text-sm text-muted-foreground">Anonymous suggestions submitted through the public website.</p></div>{feedback.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No feedback yet.</p> : <div className="divide-y divide-border">{feedback.map(item=><article key={item.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{item.category}</span><time className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">Submission #{item.id}</p></article>)}</div>}</section>
    <p className="mt-6 text-xs text-muted-foreground">Private admin area. Access is restricted in both the interface and database policies. User passwords are never available to this panel.</p>
  </div></main>;
}
