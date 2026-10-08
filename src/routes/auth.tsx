import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailOtpForm } from "@/components/email-otp-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Search = { next?: string };
const POST_AUTH_PATH_KEY = "unicompass:post-auth-path";

function safeNextPath(next?: string) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

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
    sessionStorage.setItem(POST_AUTH_PATH_KEY, safeNextPath(next));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      sessionStorage.removeItem(POST_AUTH_PATH_KEY);
      setBusy(false);
      toast.error(error.message);
    }
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

        <EmailOtpForm onSignedIn={() => navigate({ to: safeNextPath(next), replace: true })} />
      </Card>

      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground underline">
        Continue without an account
      </Link>
    </main>
  );
}
