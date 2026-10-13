import { syncProfileToAccount } from "@/lib/profile-sync";
import { useEffect, useRef, useState, useCallback, useId, isValidElement, cloneElement } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Trash2, GraduationCap, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { generateReport } from "@/lib/ai.functions";
import {
  EMPTY_PROFILE, loadStore, saveStore, saveReport, newId,
  type Profile, type EC, type Award,
} from "@/lib/local-store";

const STEPS = ["About you", "Academics", "Activities", "Awards"];

export function ProfileWizard() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ecs, setEcs] = useState<EC[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const navigate = useNavigate();
  const generate = useServerFn(generateReport);

  useEffect(() => {
    const store = loadStore();
    setProfile(store.profile);
    setEcs(store.ecs);
    setAwards(store.awards);
    setLoading(false);
  }, []);

  const [syncError, setSyncError] = useState("");
  const lastSynced = useRef("");
  const saveProfile = useCallback(() => {
    saveStore({ profile });
    const snapshot = JSON.stringify(profile);
    if (snapshot === lastSynced.current) return;
    setSaving(true);
    void syncProfileToAccount(profile).then((r) => {
      if (r.status === "error") {
        setSyncError(r.message);
        toast.error(`Couldn't save to your account: ${r.message}`);
      } else {
        setSyncError("");
        lastSynced.current = snapshot;
      }
    }).finally(() => setSaving(false));
  }, [profile]);

  // save locally right away; sync to the account at most once per pause in typing
  useEffect(() => {
    if (loading) return;
    saveStore({ profile });
    const t = setTimeout(() => { saveProfile(); }, 2000);
    return () => clearTimeout(t);
  }, [profile, loading, saveProfile]);

  const addEc = () => setEcs([...ecs, { id: newId(), name: "", category: "", leadership_role: "", hours_per_week: null, description: "" }]);
  const updateEc = (i: number, patch: Partial<EC>) => {
    const next = ecs.map((e, idx) => idx === i ? { ...e, ...patch } : e);
    setEcs(next);
    saveStore({ ecs: next });
  };
  const removeEc = (i: number) => {
    const next = ecs.filter((_, idx) => idx !== i);
    setEcs(next);
    saveStore({ ecs: next });
  };
  const saveEc = (i: number) => {
    if (!ecs[i].name.trim()) return toast.error("Activity name required");
    saveStore({ ecs });
    toast.success("Activity saved");
  };

  const addAward = () => setAwards([...awards, { id: newId(), title: "", selection_level: "", description: "" }]);
  const updateAward = (i: number, patch: Partial<Award>) => {
    const next = awards.map((a, idx) => idx === i ? { ...a, ...patch } : a);
    setAwards(next);
    saveStore({ awards: next });
  };
  const removeAward = (i: number) => {
    const next = awards.filter((_, idx) => idx !== i);
    setAwards(next);
    saveStore({ awards: next });
  };
  const saveAward = (i: number) => {
    if (!awards[i].title.trim()) return toast.error("Award title required");
    saveStore({ awards });
    toast.success("Award saved");
  };

  const handleGenerate = async () => {
    setGenerationError("");
    setGenerating(true);
    try {
      saveProfile();
      const payload = await generate({
        data: { profile: { ...profile }, extracurriculars: ecs, awards },
      });
      const report = saveReport(payload as unknown as Record<string, unknown>);
      toast.success("Report generated");
      navigate({ to: "/reports/$id", params: { id: report.id } });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Your analysis could not be generated. Please try again.";
      setGenerationError(message);
      toast.error(message);
    } finally { setGenerating(false); }
  };

  if (loading) return <div role="status" aria-label="Loading profile" className="space-y-4 py-10"><div className="loading-sheen h-8 w-48" /><div className="loading-sheen h-64 w-full" /></div>;

  const num = (v: string) => v === "" ? null : Number(v);

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-4 gap-2 mb-8" aria-label="Profile steps">{STEPS.map((name, i) => <li key={name}><Button variant="ghost" onClick={() => setStep(i)} disabled={generating} aria-current={step === i ? "step" : undefined} className={"h-auto w-full flex-col sm:flex-row justify-start px-2 py-3 " + (step === i ? "bg-accent text-accent-foreground" : "text-muted-foreground")}><span className={"grid size-7 shrink-0 place-items-center rounded-full border text-xs " + (i <= step ? "bg-primary text-primary-foreground border-primary" : "border-border")}>{i < step ? <Check className="size-3" /> : i + 1}</span><span className="text-xs sm:text-sm">{name}</span></Button></li>)}</ol>
      <div className="tool-panel wizard-fields">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of 4</div>
            <h2 className="font-display text-2xl mt-1">{STEPS[step]}</h2>
          </div>
          <div className={"text-xs " + (syncError ? "text-destructive" : "text-muted-foreground")}>{saving ? "Saving…" : syncError ? "Saved on this device · account sync failed" : "Saved"}</div>
        </div>
        <Progress aria-label="Profile progress" value={((step + 1) / 4) * 100} className="mb-6 h-1" />
        <p className="mb-6 text-sm leading-6 text-muted-foreground">{["Start with your background and the fields you want to explore.", "Add the academic details you have. Leave unavailable scores blank.", "Show what you do beyond the classroom: leadership, work, service, and projects.", "Add recognition that reflects your achievements, then generate your university shortlist."][step]}</p>

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
              <Card key={e.id} className="p-5 bg-secondary/40">
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
                  <Label htmlFor={`ec-description-${e.id}`} className="text-xs">Description / impact</Label>
                  <Textarea id={`ec-description-${e.id}`} rows={3} value={e.description} onChange={(v) => updateEc(i, { description: v.target.value })} />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" aria-label="Delete activity" title="Delete activity" onClick={() => removeEc(i)}><Trash2 className="h-4 w-4" /></Button>
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
              <Card key={a.id} className="p-5 bg-secondary/40">
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
                  <Label htmlFor={`award-description-${a.id}`} className="text-xs">Brief description</Label>
                  <Textarea id={`award-description-${a.id}`} rows={2} value={a.description} onChange={(v) => updateAward(i, { description: v.target.value })} />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" aria-label="Delete award" title="Delete award" onClick={() => removeAward(i)}><Trash2 className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={() => saveAward(i)}>Save award</Button>
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addAward}><Plus className="h-4 w-4 mr-1" />Add award</Button>
          </div>
        )}

        {generationError && <div role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{generationError}</div>}
        {generating && <div role="status" aria-live="polite" className="mt-6 border-t pt-6"><div className="flex items-center gap-3"><Loader2 className="size-5 animate-spin text-primary" /><div><p className="font-medium">Preparing your university shortlist</p><p className="mt-1 text-xs text-muted-foreground">Reviewing your profile, university fit, and next steps. This may take a little time.</p></div></div><div className="loading-sheen mt-4 h-2 w-full" /></div>}
        <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-t pt-6">
          <Button variant="ghost" disabled={step === 0 || generating} onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="justify-self-end">Continue<ArrowRight /></Button>
          ) : (
            <Button size="lg" className="shadow-elegant justify-self-end" disabled={generating} onClick={handleGenerate}>
              {generating ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Analyzing…</> : <><GraduationCap className="h-4 w-4 mr-2" />Generate Admissions Analysis</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div id={id + "-field"}>{isValidElement(children) ? cloneElement(children as React.ReactElement<{ id?: string; "aria-label"?: string }>, { id, "aria-label": label }) : children}</div>
    </div>
  );
}
