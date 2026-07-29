  import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
  import { useEffect, useState } from "react";
  import { supabase } from "@/integrations/supabase/client";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Card } from "@/components/ui/card";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
  import { toast } from "sonner";
  import { Loader2, MailCheck } from "lucide-react";
  import { ensureProfile } from "@/lib/profile.functions";
  import { NEXT_KEY, safeNext } from "@/lib/auth-next";

  export const Route = createFileRoute("/auth")({
    head: () => ({
      meta: [
        { title: "Sign in — UniCompass" },
        { name: "description", content: "Sign in or create your free UniCompass account to build your admissions profile." },
        { name: "robots", content: "noindex, follow" },
      ],
    }),
    validateSearch: (s: Record<string, unknown>): { next?: string } => {
      const next = safeNext(typeof s.next === "string" ? s.next : undefined);
      return next ? { next } : {};
    },
    component: AuthPage,
  });

  /** Turn Supabase auth errors into short, human wording. */
  function friendlyError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "That email and password don't match an account.";
    if (m.includes("email not confirmed")) return "Please confirm your email address first — check your inbox.";
    if (m.includes("user not found")) return "We couldn't find an account with that email.";
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
      return "An account with that email already exists. Try signing in instead.";
    if (m.includes("known to be weak") || m.includes("pwned"))
      return "That password has appeared in a data breach. Please choose a stronger, unique one.";
    if (m.includes("password should be at least")) return "Your password needs to be at least 8 characters.";
    if (m.includes("rate limit") || m.includes("too many") || m.includes("over_email_send"))
      return "Too many attempts. Please wait a minute and try again.";
    if (m.includes("unable to validate email") || m.includes("invalid email")) return "That email address doesn't look valid.";
    if (m.includes("error sending") || m.includes("smtp") || m.includes("email delivery"))
      return "We couldn't send the email right now. Please try again in a moment.";
    if (m.includes("failed to fetch") || m.includes("network") || m.includes("networkerror"))
      return "Network problem — check your connection and try again.";
    return message || "Something went wrong. Please try again.";
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function passwordProblem(pw: string): string | null {
    if (pw.length < 8) return "Use at least 8 characters.";
    if (!/[a-z]/i.test(pw)) return "Include at least one letter.";
    if (!/\d/.test(pw)) return "Include at least one number.";
    return null;
  }

  type Mode = "signin" | "signup" | "forgot";

  function AuthPage() {
    const navigate = useNavigate();
    const { next } = Route.useSearch();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pending, setPending] = useState<null | Mode | "google" | "resend">(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [unverified, setUnverified] = useState<string | null>(null);

    const callbackUrl = () =>
      typeof window === "undefined" ? "" : `${window.location.origin}/auth/callback`;

    const rememberNext = () => {
      if (typeof window === "undefined") return;
      if (next) sessionStorage.setItem(NEXT_KEY, next);
      else sessionStorage.removeItem(NEXT_KEY);
    };

    const goNext = async () => {
      try {
        await ensureProfile();
      } catch {
        // non-fatal
      }
      navigate({ to: next ?? "/dashboard", replace: true });
    };

    // Session persistence: if a session already exists (refresh, return visit), move on.
    useEffect(() => {
      let active = true;
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        if (data.session) void goNext();
        else setCheckingSession(false);
      });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [next]);

    const validEmail = () => {
      if (!EMAIL_RE.test(email.trim())) {
        toast.error("Enter a valid email address.");
        return false;
      }
      return true;
    };

    const handleSignIn = async () => {
      if (!validEmail()) return;
      if (!password) {
        toast.error("Enter your password.");
        return;
      }
      setPending("signin");
      setUnverified(null);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Block unverified accounts even if the project allows the session.
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setUnverified(email.trim());
          toast.error("Please verify your email address before signing in.");
          return;
        }
        toast.success("Welcome back");
        await goNext();
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.toLowerCase().includes("email not confirmed")) setUnverified(email.trim());
        toast.error(friendlyError(msg));
      } finally {
        setPending(null);
      }
    };

    const handleSignUp = async () => {
      if (!validEmail()) return;
      const problem = passwordProblem(password);
      if (problem) {
        toast.error(problem);
        return;
      }
      setPending("signup");
      setUnverified(null);
      try {
        rememberNext();
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (error) throw error;
        // Supabase returns an obfuscated user with no identities for existing emails.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          toast.error("An account with that email already exists. Try signing in instead.");
          return;
        }
        if (data.session) {
          toast.success("Account created");
          await goNext();
        } else {
          setUnverified(email.trim());
          toast.success("Account created — check your inbox to verify your email address.");
        }
      } catch (e) {
        toast.error(friendlyError((e as Error).message));
      } finally {
        setPending(null);
      }
    };

    const handleResend = async () => {
      if (!unverified) return;
      setPending("resend");
      try {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: unverified,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (error) throw error;
        toast.success("Verification email sent again — check your inbox and spam folder.");
      } catch (e) {
        toast.error(friendlyError((e as Error).message));
      } finally {
        setPending(null);
      }
    };

    const handleForgot = async () => {
      if (!validEmail()) return;
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
        rememberNext();
    
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: callbackUrl(),
          },
        });
    
        if (error) throw error;
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
                  hint="At least 8 characters, including a letter and a number."
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

            {unverified && (
              <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MailCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    We sent a verification link to <strong className="text-foreground">{unverified}</strong>. Click it to
                    activate your account, then sign in.
                  </span>
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleResend} disabled={busy}>
                  {pending === "resend" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Resend verification email
                </Button>
              </div>
            )}

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
