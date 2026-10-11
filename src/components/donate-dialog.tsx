import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Heart, ShieldCheck } from "lucide-react";

export function DonateDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" /> Help Us Grow
          </DialogTitle>
          <DialogDescription>
            Your support helps us improve university discovery, scholarship matching, and guidance for students.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">Secure contributions</p>
              <p className="text-sm text-muted-foreground">
                Bank transfer instructions are not published here yet. We will add a verified payment link or bank-approved QR code when it is ready.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          For your safety, we do not display full payment card numbers or ask you to enter card details on this website.
        </p>
      </DialogContent>
    </Dialog>
  );
}
