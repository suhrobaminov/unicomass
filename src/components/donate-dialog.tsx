import { type ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Check, ShieldCheck } from "lucide-react";

function CopyInstructionsButton() {
  const [copied, setCopied] = useState(false);

  async function copyInstructions() {
    const instructions = "To support UniCompass, please contact the site owner for verified payment instructions. Do not send money to an unverified card number.";
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={copyInstructions}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
      {copied ? "Instructions copied" : "Copy payment instructions"}
    </Button>
  );
}

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

        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">Secure contributions</p>
              <p className="text-sm text-muted-foreground">
                For your safety, full card numbers are not displayed publicly. Contact the site owner for verified payment details before sending a contribution.
              </p>
            </div>
          </div>
          <CopyInstructionsButton />
        </div>

        <p className="text-xs text-muted-foreground">
          This panel does not process payments. Never share your PIN, CVV, or banking password.
        </p>
      </DialogContent>
    </Dialog>
  );
}
