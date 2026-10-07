import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const POST_AUTH_PATH_KEY = "unicompass:post-auth-path";

function AuthReturnHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const oauthError =
      params.get("error_description") || hash.get("error_description") ||
      params.get("error") || hash.get("error");
    if (oauthError) {
      sessionStorage.removeItem(POST_AUTH_PATH_KEY);
      const msg = `Google sign-in failed: ${oauthError.replace(/\+/g, " ")}`;
      setTimeout(() => toast.error(msg), 500);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const finishGoogleSignIn = () => {
      const destination = sessionStorage.getItem(POST_AUTH_PATH_KEY);
      if (!destination) return;

      sessionStorage.removeItem(POST_AUTH_PATH_KEY);
      const safeDestination = destination.startsWith("/") && !destination.startsWith("//")
        ? destination
        : "/dashboard";
      window.location.replace(safeDestination);
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finishGoogleSignIn();
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) finishGoogleSignIn();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => { console.error("[root error boundary]", error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UniCompass — AI College Admissions Strategy" },
      { name: "description", content: "Get a personalized college admissions strategy from a veteran AI admissions officer. Reach, Target, and Safety schools tailored to your profile." },
      { property: "og:title", content: "UniCompass — AI College Admissions Strategy" },
      { property: "og:description", content: "Get a personalized college admissions strategy from a veteran AI admissions officer. Reach, Target, and Safety schools tailored to your profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "UniCompass — AI College Admissions Strategy" },
      { name: "twitter:description", content: "Get a personalized college admissions strategy from a veteran AI admissions officer. Reach, Target, and Safety schools tailored to your profile." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d2c28d07-1fc7-4895-8a3a-a8014e4f9201" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/d2c28d07-1fc7-4895-8a3a-a8014e4f9201" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthReturnHandler />
      <Outlet />
      <footer className="border-t bg-background px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-foreground">UniCompass</div>
            <div>Created by Suhrob Aminov</div>
          </div>
          <div className="flex gap-4">
            <a href="https://t.me/Uzbek_npc" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Telegram: @Uzbek_npc</a>
            <a href="https://instagram.com/Uzbek.npc" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Instagram: @Uzbek.npc</a>
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
