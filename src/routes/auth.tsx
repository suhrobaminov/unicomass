import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UniCompass" },
      { name: "description", content: "Sign in or create your free UniCompass account to build your admissions profile." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next =
      typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
        ? s.next
        : undefined;
    return next ? { next } : {};
  },
  component: AuthPage,
});

/** Turn Supabase auth errors into short, human wording. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match an account.";
  if (m.includes("email not confirmed")) return "Please confirm your email address first — check your inbox.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with that email already exists. Try signing in instead.";
  if (m.includes("password should be at least")) return "Your password needs to be at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("unable to validate email")) return "That email address doesn't look valid.";
  if (m.includes("network") || m.includes("fetch")) return "Network problem — check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | Mode | "google">(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const goNext = () => {
    if (next) navigate({ to: next, replace: true });
    else navigate({ to: "/dashboard", replace: true });
  };

  // Session persistence: if a session already exists (refresh, return visit), move on.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) goNext();
      else setCheckingSession(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  const validate = (needsPassword: boolean) => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return false;
    }
    if (needsPassword && password.length < 6) {
      toast.error("Your password needs to be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validate(true)) return;
    setPending("signin");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("Welcome back");
      goNext();
    } catch (e) {
      toast.error(friendlyError((e as Error).message));
    } finally {
      setPending(null);
    }
  };

  const handleSignUp = async () => {
    if (!validate(true)) return;
    setPending("signup");
    try {
      const emailRedirectTo = window.location.origin + (next ?? "/dashboard");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created");
        goNext();
      } else {
        toast.success("Account created — check your email to confirm your address.");
      }
    } catch (e) {
      toast.error(friendlyError((e as Error).message));
    } finally {
      setPending(null);
    }
  };

  const handleForgot = async () => {
    if (!validate(false)) return;
    setPending("forgot");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (e) {
      toast.error(friendlyError((e as Error).message));
    } finally {
      setPending(null);
    }
  };

  const handleGoogle = async () => {
    setPending("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + (next ?? "/dashboard"),
      });
      if (result.error) throw new Error(result.error.message || "Google sign-in failed");
      if (result.redirected) return;
      goNext();
    } catch (e) {
      toast.error(friendlyError((e as Error).message));
    } finally {
      setPending(null);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  const busy = pending !== null;

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
          <h1 className="sr-only">Sign in to UniCompass</h1>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="forgot">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <EmailField id="signin-email" value={email} onChange={setEmail} disabled={busy} />
              <PasswordField
                id="signin-pw"
                value={password}
                onChange={setPassword}
                disabled={busy}
                autoComplete="current-password"
              />
              <Button className="w-full" onClick={handleSignIn} disabled={busy}>
                {pending === "signin" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <EmailField id="signup-email" value={email} onChange={setEmail} disabled={busy} />
              <PasswordField
                id="signup-pw"
                value={password}
                onChange={setPassword}
                disabled={busy}
                autoComplete="new-password"
                hint="At least 6 characters."
              />
              <Button className="w-full" onClick={handleSignUp} disabled={busy}>
                {pending === "signup" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create account
              </Button>
            </TabsContent>

            <TabsContent value="forgot" className="space-y-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a link to set a new password.
              </p>
              <EmailField id="forgot-email" value={email} onChange={setEmail} disabled={busy} />
              <Button className="w-full" onClick={handleForgot} disabled={busy}>
                {pending === "forgot" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            {pending === "google" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continue with Google
          </Button>
        </Card>
      </div>
    </main>
  );
}

function EmailField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        id={id}
        type="email"
        autoComplete="email"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  disabled,
  autoComplete,
  hint,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Password</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
