import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Public Google Web Client ID (not a secret).
export const GOOGLE_CLIENT_ID =
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

export function GoogleSignInButton({ onSignedIn }: { onSignedIn: () => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [gisError, setGisError] = useState<string | null>(null);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

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
            onSignedInRef.current();
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
  }, []);

  return (
    <>
      <div ref={buttonRef} className="flex min-h-[44px] w-full justify-center" />
      {gisError ? <p className="mt-2 text-center text-sm text-destructive">{gisError}</p> : null}
    </>
  );
}
