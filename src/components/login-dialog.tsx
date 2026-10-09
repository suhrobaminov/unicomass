"use client";

import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmailOtpForm } from "@/components/email-otp-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const POST_AUTH_PATH_KEY = "unicompass:post-auth-path";

function safeNextPath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginDialog({ children, next = "/dashboard" }: { children: React.ReactNode; next?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md sm:rounded-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-2xl">Welcome to UniCompass</DialogTitle>
          <DialogDescription>
            Sign in to sync your profile across devices, or continue without an account.
          </DialogDescription>
        </DialogHeader>

        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>

        <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <EmailOtpForm
          onSignedIn={() => {
            setOpen(false);
            navigate({ to: safeNextPath(next), replace: true });
          }}
        />

        <div className="mt-2 text-center">
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground underline"
            onClick={() => setOpen(false)}
          >
            Continue without an account
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
