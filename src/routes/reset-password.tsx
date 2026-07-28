import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — UniCompass" },
      { name: "description", content: "Choose a new password for your UniCompass account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // Supabase puts a recovery session in the URL hash and the client picks it up.
  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setValid(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setValid(true);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    if (password.length < 6) {
      toast.error("Your password needs to be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error((e as Error).message || "Could not update your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">
            U
          </div>
          <span className="font-display text-xl font-semibold">UniCompass</span>
        </Link>
        <Card className="p-8 shadow-elegant">
          <h1 className="font-display text-xl font-semibold">Set a new password</h1>
          {!ready ? (
            <div className="py-8 grid place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
            </div>
          ) : !valid ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <Link to="/auth">
                <Button className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={saving}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  disabled={saving}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
