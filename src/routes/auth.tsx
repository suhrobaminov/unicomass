import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Search = { next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    next: typeof search["next"] === "string" ? (search["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — UniCompass" },
      { name: "description", content: "Sign in to UniCompass to sync your admissions profile and strategy reports across devices." },
      { property: "og:title", content: "Sign in — UniCompass" },
      { property: "og:description", content: "Sign in to UniCompass to sync your admissions profile and strategy reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: next ?? "/dashboard", replace: true });
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: next ?? "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + (next ?? "/dashboard") },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + (next ?? "/dashboard") },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) toast.success("Check your email to confirm your account.");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold">Welcome to UniCompass</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signing in is optional — your work is saved on this device either way.
        </p>
      </div>

      <Card className="p-6">
        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form className="mt-4 space-y-4" onSubmit={handleSignIn}>
              <Fields email={email} password={password} setEmail={setEmail} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="mt-4 space-y-4" onSubmit={handleSignUp}>
              <Fields email={email} password={password} setEmail={setEmail} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground underline">
        Continue without an account
      </Link>
    </main>
  );
}

function Fields(props: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={props.email} onChange={(e) => props.setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={8} value={props.password} onChange={(e) => props.setPassword(e.target.value)} />
      </div>
    </>
  );
}
