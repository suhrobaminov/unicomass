import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, CheckCircle2, Lock, CreditCard } from "lucide-react";

// ============================================================================
// PAYMENT GATEWAY PLACEHOLDER
// ----------------------------------------------------------------------------
// This is a mock frontend-only donation flow. NO card data is transmitted or
// stored. To wire this up to a real gateway (Stripe / PayPal), replace the
// `processDonation` function below with a call to a server function that
// creates a PaymentIntent / Checkout Session and returns a client secret.
//
// Example wiring points:
//   - Stripe:  await fetch('/api/donations/create-intent', { ... })
//              then confirm via `stripe.confirmCardPayment(clientSecret)`
//   - PayPal:  render <PayPalButtons createOrder={...} onApprove={...} />
// ============================================================================
async function processDonation(_amount: number, _card: CardData): Promise<{ ok: true }> {
  // TODO: replace with real Stripe/PayPal integration.
  await new Promise((r) => setTimeout(r, 1800));
  return { ok: true };
}

type CardData = { name: string; number: string; exp: string; cvv: string };

const PRESETS = [5, 15, 50, 100];

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function DonateDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "pay" | "success">("amount");
  const [amount, setAmount] = useState<number>(15);
  const [custom, setCustom] = useState("");
  const [card, setCard] = useState<CardData>({ name: "", number: "", exp: "", cvv: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setStep("amount"); setAmount(15); setCustom(""); setCard({ name: "", number: "", exp: "", cvv: "" }); setError(null); };

  const finalAmount = custom ? Number(custom) : amount;

  const validate = () => {
    if (!card.name.trim()) return "Cardholder name is required";
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 19) return "Enter a valid card number";
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) return "Expiration must be MM/YY";
    if (!/^\d{3,4}$/.test(card.cvv)) return "CVV must be 3–4 digits";
    if (!finalAmount || finalAmount < 1) return "Enter a donation amount";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    await processDonation(finalAmount, card);
    setLoading(false);
    setStep("success");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 200); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {step === "amount" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" /> Support youradviser
              </DialogTitle>
              <DialogDescription>
                Your donation keeps profile analyses free for students who need them most.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => { setAmount(v); setCustom(""); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    !custom && amount === v ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-display text-2xl font-semibold">${v}</div>
                  <div className="text-xs text-muted-foreground">
                    {v <= 5 ? "A coffee's worth" : v <= 15 ? "Supports 1 report" : v <= 50 ? "Sponsor a student" : "Champion tier"}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <label className="text-xs text-muted-foreground">Or enter a custom amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="25"
                  className="pl-7"
                />
              </div>
            </div>
            <Button className="mt-2 w-full h-11" onClick={() => setStep("pay")} disabled={!finalAmount || finalAmount < 1}>
              Continue to payment · ${finalAmount || 0}
            </Button>
          </>
        )}

        {step === "pay" && (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment details
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Encrypted end-to-end. You're donating ${finalAmount}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Cardholder name</label>
                <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Card number</label>
                <Input
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Expiration</label>
                  <Input
                    value={card.exp}
                    onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })}
                    placeholder="MM/YY"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">CVV</label>
                  <Input
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="123"
                    inputMode="numeric"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("amount")} disabled={loading}>Back</Button>
              <Button type="submit" className="flex-1 h-11" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : `Confirm donation · $${finalAmount}`}
              </Button>
            </div>
            <p className="mt-3 text-[10px] text-center text-muted-foreground">
              Demo checkout. No real charge is made. Live Stripe / PayPal integration coming soon.
            </p>
          </form>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 grid place-items-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold">Thank you for supporting youradviser! 🎉</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your ${finalAmount} donation helps us reach more students with world-class admissions guidance.
            </p>
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
