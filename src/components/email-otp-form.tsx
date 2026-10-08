import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const RESEND_SECONDS = 60;

function friendly(err: { message: string; status?: number; code?: string }) {
  const m = err.message.toLowerCase();
  if (err.status === 429 || m.includes("rate limit") || m.includes("security purposes"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("expired") || m.includes("invalid") || err.code === "otp_expired")
    return "That code is invalid or has expired. Check the latest email or request a new code.";
  return err.message;
}

/** Passwordless email sign-in: email -> 6-digit code -> session. Works for new and existing users. */
export function EmailOtpForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      const msg = friendly(error);
      setError(msg);
      return toast.error(msg);
    }
    setStep("code");
    setCode("");
    setCooldown(RESEND_SECONDS);
    toast.success(`We sent a code to ${email.trim()}`);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error || !data.session) {
      const msg = error ? friendly(error) : "Could not start a session. Please try again.";
      setError(msg);
      return toast.error(msg);
    }
    toast.success("You're signed in.");
    onSignedIn();
  }

  if (step === "email") {
    return (
      <form className="mt-4 space-y-4" onSubmit={sendCode}>
        <div className="space-y-1.5">
          <Label htmlFor="otp-email">Email</Label>
          <Input id="otp-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Email me a sign-in code
        </Button>
        <p className="text-center text-xs text-muted-foreground">No password needed. New here? An account is created automatically.</p>
      </form>
    );
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={verify}>
      <p className="text-sm text-muted-foreground">
        Enter the code sent to <span className="font-medium text-foreground">{email}</span>.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="otp-code">Confirmation code</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          pattern="[0-9]{6,10}"
          maxLength={10}
          className="tabular-nums tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify and sign in
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" className="text-muted-foreground underline" onClick={() => { setStep("email"); setError(null); }}>
          Change email
        </button>
        <button type="button" className="text-muted-foreground underline disabled:no-underline disabled:opacity-60" disabled={busy || cooldown > 0} onClick={() => sendCode()}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
