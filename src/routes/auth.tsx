import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — UniCompass" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
      ? s.next
      : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    if (next) window.location.href = next;
    else navigate({ to: "/dashboard" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goNext();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  const handleAuth = async (mode: "signin" | "signup") => {
    setLoading(true);
    try {
      const returnTo = next ? window.location.origin + next : window.location.origin;
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const args = mode === "signup"
        ? { email, password, options: { emailRedirectTo: returnTo } }
        : { email, password };
      const { error } = await fn(args as never);
      if (error) throw error;
      toast.success(mode === "signup" ? "Account created — check your email if confirmation is required." : "Welcome back");
      goNext();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      const redirect_uri = next ? window.location.origin + next : window.location.origin;
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
      if (result.error) throw new Error(result.error.message || "Google sign-in failed");
      if (result.redirected) return;
      goNext();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen bg-hero grid place-items-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold">y</div>
          <span className="font-display text-xl font-semibold">UniCompass</span>
        </Link>
        <Card className="p-8 shadow-elegant">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-email`}>Email</Label>
                  <Input id={`${mode}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-pw`}>Password</Label>
                  <Input id={`${mode}-pw`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => handleAuth(mode)} disabled={loading}>
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>Continue with Google</Button>
        </Card>
      </div>
    </div>
  );
}
