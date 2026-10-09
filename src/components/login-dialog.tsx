"use client";

import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { EmailOtpForm } from "@/components/email-otp-form";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function safeNextPath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginDialog({ children, next = "/dashboard" }: { children: React.ReactNode; next?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

        <GoogleSignInButton
          onSignedIn={() => {
            setOpen(false);
            navigate({ to: safeNextPath(next), replace: true });
          }}
        />

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
