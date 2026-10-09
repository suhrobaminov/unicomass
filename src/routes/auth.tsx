import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { EmailOtpForm } from "@/components/email-otp-form";
import { toast } from "sonner";

type Search = { next?: string };

// Public Google Web Client ID (not a secret).
const GOOGLE_CLIENT_ID =
  "399336357296-r2sg53a2pk73nro5ui03bqk6ustkqk6na.apps.googleusercontent.com";
const GIS_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = { credential?: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const onLoad = () => resolve();
    const onError = () => {
      gisPromise = null;
      script.remove();
      reject(new Error("Could not load Google sign-in."));
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  return gisPromise;
}

async function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

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
  const buttonRef = useRef<HTMLDivElement>(null);
  const [gisError, setGisError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: next ?? "/dashboard", replace: true });
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: next ?? "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  useEffect(() => {
    let cancelled = false;
    const container = buttonRef.current;
    (async () => {
      try {
        const [{ raw, hashed }] = await Promise.all([makeNonce(), loadGis()]);
        if (cancelled || !container || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          callback: async (response) => {
            if (!response.credential) {
              toast.error("Google sign-in was cancelled or failed.");
              return;
            }
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: raw,
            });
            if (error) {
              toast.error(`Google sign-in failed: ${error.message}`);
              return;
            }
            navigate({ to: safeNextPath(next), replace: true });
          },
        });
        container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(container.offsetWidth || 336, 400),
        });
      } catch (e) {
        if (!cancelled) setGisError(e instanceof Error ? e.message : "Google sign-in unavailable.");
      }
    })();
    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
      if (container) container.innerHTML = "";
    };
  }, [navigate, next]);

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold">Welcome to UniCompass</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signing in is optional — your work is saved on this device either way.
        </p>
      </div>

      <Card className="p-6">
        <div ref={buttonRef} className="flex min-h-[44px] w-full justify-center" />
        {gisError ? <p className="mt-2 text-center text-sm text-destructive">{gisError}</p> : null}

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
