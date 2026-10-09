import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, AlertCircle } from "lucide-react";

const PRESETS = [5, 15, 50, 100];

export function DonateDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(15);
  const [custom, setCustom] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(false);
  const finalAmount = custom.trim() ? Number(custom) : amount;

  function reset() {
    setAmount(15);
    setCustom("");
    setShowUnavailable(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {!showUnavailable ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" /> Support UniCompass
              </DialogTitle>
              <DialogDescription>
                Choose an amount. Online donations are not enabled yet, and no payment details will be requested.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {PRESETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={!custom && amount === value}
                  onClick={() => { setAmount(value); setCustom(""); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    !custom && amount === value ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-display text-2xl font-semibold">${value}</div>
                  <div className="text-xs text-muted-foreground">
                    {value <= 5 ? "A coffee's worth" : value <= 15 ? "Supports 1 report" : value <= 50 ? "Sponsor a student" : "Champion tier"}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <label htmlFor="donation-amount" className="text-xs text-muted-foreground">Or enter a custom amount (USD)</label>
              <input
                id="donation-amount"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder="25"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button
              className="mt-2 h-11 w-full"
              onClick={() => setShowUnavailable(true)}
              disabled={!Number.isFinite(finalAmount) || finalAmount < 1 || finalAmount > 10000}
            >
              Continue · ${Number.isFinite(finalAmount) ? finalAmount : 0}
            </Button>
          </>
        ) : (
          <div className="py-5 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <DialogHeader>
              <DialogTitle className="mt-3 font-display text-2xl">Donations aren't available yet</DialogTitle>
              <DialogDescription className="mt-2">
                Your selected amount is ${finalAmount}. UniCompass has not connected a payment provider, so no donation has been taken. Please do not send card details.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowUnavailable(false)}>Back</Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
