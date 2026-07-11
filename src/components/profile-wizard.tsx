import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { generateReport } from "@/lib/ai.functions";

type Profile = {
  full_name: string; region: string; intended_majors: string;
  graduation_year: number | null;
  gpa_unweighted: number | null; gpa_weighted: number | null;
  class_rank: string;
  sat_score: number | null; act_score: number | null;
  ap_count: number; ib_count: number; honors_count: number;
};
type EC = { id?: string; name: string; category: string; leadership_role: string; hours_per_week: number | null; description: string; };
type Award = { id?: string; title: string; selection_level: string; description: string; };

const EMPTY_PROFILE: Profile = {
  full_name: "", region: "", intended_majors: "", graduation_year: null,
  gpa_unweighted: null, gpa_weighted: null, class_rank: "",
  sat_score: null, act_score: null, ap_count: 0, ib_count: 0, honors_count: 0,
};

const STEPS = ["Demographics", "Academics", "Activities", "Awards"];

export function ProfileWizard() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ecs, setEcs] = useState<EC[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const generate = useServerFn(generateReport);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      userIdRef.current = userData.user.id;
      const [{ data: p }, { data: e }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userData.user.id).maybeSingle(),
        supabase.from("extracurriculars").select("*").eq("user_id", userData.user.id).order("created_at"),
        supabase.from("awards").select("*").eq("user_id", userData.user.id).order("created_at"),
      ]);
      if (p) setProfile({
        ...EMPTY_PROFILE,
        full_name: p.full_name ?? "",
        region: p.region ?? "",
        intended_majors: p.intended_majors ?? "",
        graduation_year: p.graduation_year,
        gpa_unweighted: p.gpa_unweighted != null ? Number(p.gpa_unweighted) : null,
        gpa_weighted: p.gpa_weighted != null ? Number(p.gpa_weighted) : null,
        class_rank: p.class_rank ?? "",
        sat_score: p.sat_score,
        act_score: p.act_score,
        ap_count: p.ap_count ?? 0,
        ib_count: p.ib_count ?? 0,
        honors_count: p.honors_count ?? 0,
      });
      if (e) setEcs(e as EC[]);
      if (a) setAwards(a as Award[]);
      setLoading(false);
    })();
  }, []);

  const saveProfile = useCallback(async () => {
    if (!userIdRef.current) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert(
      { user_id: userIdRef.current, ...profile },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Progress saved");
  }, [profile]);

  // autosave profile on change (debounced)
  useEffect(() => {
    if (loading || !userIdRef.current) return;
    const t = setTimeout(() => { void saveProfile(); }, 1200);
    return () => clearTimeout(t);
  }, [profile, loading, saveProfile]);

  const addEc = () => setEcs([...ecs, { name: "", category: "", leadership_role: "", hours_per_week: null, description: "" }]);
  const updateEc = (i: number, patch: Partial<EC>) => setEcs(ecs.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const removeEc = async (i: number) => {
    const target = ecs[i];
    if (target.id) await supabase.from("extracurriculars").delete().eq("id", target.id);
    setEcs(ecs.filter((_, idx) => idx !== i));
  };
  const saveEc = async (i: number) => {
    if (!userIdRef.current) return;
    const e = ecs[i];
    if (!e.name.trim()) return toast.error("Activity name required");
    const row = { user_id: userIdRef.current, name: e.name, category: e.category, leadership_role: e.leadership_role, hours_per_week: e.hours_per_week, description: e.description };
    if (e.id) {
      await supabase.from("extracurriculars").update(row).eq("id", e.id);
    } else {
      const { data } = await supabase.from("extracurriculars").insert(row).select().single();
      if (data) updateEc(i, { id: data.id });
    }
    toast.success("Activity saved");
  };

  const addAward = () => setAwards([...awards, { title: "", selection_level: "", description: "" }]);
  const updateAward = (i: number, patch: Partial<Award>) => setAwards(awards.map((a, idx) => idx === i ? { ...a, ...patch } : a));
  const removeAward = async (i: number) => {
    const target = awards[i];
    if (target.id) await supabase.from("awards").delete().eq("id", target.id);
    setAwards(awards.filter((_, idx) => idx !== i));
  };
  const saveAward = async (i: number) => {
    if (!userIdRef.current) return;
    const a = awards[i];
    if (!a.title.trim()) return toast.error("Award title required");
    const row = { user_id: userIdRef.current, title: a.title, selection_level: a.selection_level, description: a.description };
    if (a.id) await supabase.from("awards").update(row).eq("id", a.id);
    else {
      const { data } = await supabase.from("awards").insert(row).select().single();
      if (data) updateAward(i, { id: data.id });
    }
    toast.success("Award saved");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await saveProfile();
      const report = await generate();
      toast.success("Report generated");
      navigate({ to: "/reports/$id", params: { id: (report as { id: string }).id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setGenerating(false); }
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" /></div>;

  const num = (v: string) => v === "" ? null : Number(v);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of 4</div>
            <h2 className="font-display text-2xl mt-1">{STEPS[step]}</h2>
          </div>
          <div className="text-sm text-muted-foreground">{saving ? "Saving…" : "Autosaved"}</div>
        </div>
        <Progress value={((step + 1) / 4) * 100} className="mb-6" />

        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name"><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></Field>
            <Field label="High school region"><Input placeholder="e.g. Bay Area, CA" value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} /></Field>
            <Field label="Intended majors / fields"><Input placeholder="Computer Science, Economics" value={profile.intended_majors} onChange={(e) => setProfile({ ...profile, intended_majors: e.target.value })} /></Field>
            <Field label="Target graduation year"><Input type="number" value={profile.graduation_year ?? ""} onChange={(e) => setProfile({ ...profile, graduation_year: num(e.target.value) })} /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Unweighted GPA (0-4.0)"><Input type="number" step="0.01" value={profile.gpa_unweighted ?? ""} onChange={(e) => setProfile({ ...profile, gpa_unweighted: num(e.target.value) })} /></Field>
            <Field label="Weighted GPA"><Input type="number" step="0.01" value={profile.gpa_weighted ?? ""} onChange={(e) => setProfile({ ...profile, gpa_weighted: num(e.target.value) })} /></Field>
            <Field label="Class rank"><Input placeholder="e.g. 12/450 or Top 5%" value={profile.class_rank} onChange={(e) => setProfile({ ...profile, class_rank: e.target.value })} /></Field>
            <div />
            <Field label="SAT superscore"><Input type="number" value={profile.sat_score ?? ""} onChange={(e) => setProfile({ ...profile, sat_score: num(e.target.value) })} /></Field>
            <Field label="ACT superscore"><Input type="number" value={profile.act_score ?? ""} onChange={(e) => setProfile({ ...profile, act_score: num(e.target.value) })} /></Field>
            <Field label="# AP classes"><Input type="number" value={profile.ap_count} onChange={(e) => setProfile({ ...profile, ap_count: Number(e.target.value) || 0 })} /></Field>
            <Field label="# IB classes"><Input type="number" value={profile.ib_count} onChange={(e) => setProfile({ ...profile, ib_count: Number(e.target.value) || 0 })} /></Field>
            <Field label="# Honors classes"><Input type="number" value={profile.honors_count} onChange={(e) => setProfile({ ...profile, honors_count: Number(e.target.value) || 0 })} /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {ecs.length === 0 && <p className="text-sm text-muted-foreground">No activities yet. Add your first one.</p>}
            {ecs.map((e, i) => (
              <Card key={i} className="p-4 bg-secondary/40">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Activity name"><Input value={e.name} onChange={(v) => updateEc(i, { name: v.target.value })} /></Field>
                  <Field label="Category">
                    <Select value={e.category} onValueChange={(v) => updateEc(i, { category: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                      <SelectContent>
                        {["Sports", "Arts", "STEM", "Volunteer", "Academic", "Leadership", "Work", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Leadership role"><Input placeholder="President, Captain…" value={e.leadership_role} onChange={(v) => updateEc(i, { leadership_role: v.target.value })} /></Field>
                  <Field label="Hours / week"><Input type="number" value={e.hours_per_week ?? ""} onChange={(v) => updateEc(i, { hours_per_week: num(v.target.value) })} /></Field>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Description / impact</Label>
                  <Textarea rows={3} value={e.description} onChange={(v) => updateEc(i, { description: v.target.value })} />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeEc(i)}><Trash2 className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={() => saveEc(i)}>Save activity</Button>
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addEc}><Plus className="h-4 w-4 mr-1" />Add activity</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {awards.length === 0 && <p className="text-sm text-muted-foreground">No awards yet.</p>}
            {awards.map((a, i) => (
              <Card key={i} className="p-4 bg-secondary/40">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Award title"><Input value={a.title} onChange={(v) => updateAward(i, { title: v.target.value })} /></Field>
                  <Field label="Selection level">
                    <Select value={a.selection_level} onValueChange={(v) => updateAward(i, { selection_level: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                      <SelectContent>
                        {["School", "Regional", "State", "National", "International"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Brief description</Label>
                  <Textarea rows={2} value={a.description} onChange={(v) => updateAward(i, { description: v.target.value })} />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeAward(i)}><Trash2 className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={() => saveAward(i)}>Save award</Button>
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addAward}><Plus className="h-4 w-4 mr-1" />Add award</Button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button size="lg" className="shadow-elegant" disabled={generating} onClick={handleGenerate}>
              {generating ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Analyzing…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Admissions Analysis</>}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
