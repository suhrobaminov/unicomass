import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ensureProfile } from "@/lib/profile.functions";
import { NEXT_KEY, safeNext } from "@/lib/auth-next";

export const Route = createFileRoute("/auth_/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — UniCompass" },
      { name: "description", content: "Completing your UniCompass sign-in." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let active = true;

    const finish = async (hasSession: boolean) => {
      if (!active) return;
      if (!hasSession) {
        setMessage("We couldn't complete the sign-in.");
        toast.error("Sign-in could not be completed. Please try again.");
        navigate({ to: "/auth", replace: true });
        return;
      }
      try {
        await ensureProfile();
      } catch {
        // Profile creation is retried on the dashboard; never block sign-in.
      }
      if (!active) return;
      const next = safeNext(sessionStorage.getItem(NEXT_KEY));
      sessionStorage.removeItem(NEXT_KEY);
      navigate({ to: next ?? "/dashboard", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finish(true);
    });

    // Give Supabase a moment to parse the URL fragment / code exchange.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      void finish(Boolean(data.session));
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
        <h1 className="text-sm text-muted-foreground">{message}</h1>
      </div>
    </main>
  );
}
