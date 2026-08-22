"use client";

import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginDialog({ children, next = "/dashboard" }: { children: React.ReactNode; next?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + next },
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
    if (error) return toast.error(error.message);
    setOpen(false);
    navigate({ to: next, replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + next },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
    } else {
      setOpen(false);
      navigate({ to: next, replace: true });
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

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form className="mt-4 space-y-4" onSubmit={handleSignIn}>
              <Fields email={email} password={password} setEmail={setEmail} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={busy}>
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="mt-4 space-y-4" onSubmit={handleSignUp}>
              <Fields email={email} password={password} setEmail={setEmail} setPassword={setPassword} />
              <Button type="submit" className="w-full" disabled={busy}>
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

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

function Fields(props: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          required
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          required
          minLength={8}
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
