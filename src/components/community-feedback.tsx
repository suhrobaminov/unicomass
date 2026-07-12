import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, MessageSquareQuote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

type Comment = {
  id: string;
  user_id: string;
  display_name: string;
  rating: number;
  body: string;
  created_at: string;
};

function Stars({ value, onChange, size = 20 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const Cmp = onChange ? "button" : "span";
        return (
          <Cmp
            key={n}
            type={onChange ? "button" : undefined}
            onClick={onChange ? () => onChange(n) : undefined}
            className={onChange ? "transition-transform hover:scale-110" : ""}
            aria-label={onChange ? `${n} star${n > 1 ? "s" : ""}` : undefined}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-accent text-accent" : "text-muted-foreground/40"}
            />
          </Cmp>
        );
      })}
    </div>
  );
}

export function CommunityFeedback() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) setName((data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "");
    });
  }, []);

  useEffect(() => {
    supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setComments((data as Comment[]) ?? []));

    const channel = supabase
      .channel("comments-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (payload) => {
        setComments((prev) => [payload.new as Comment, ...prev].slice(0, 24));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, (payload) => {
        setComments((prev) => prev.filter((c) => c.id !== (payload.old as Comment).id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (body.trim().length < 3) {
      toast.error("Review is too short");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      display_name: name.trim().slice(0, 80) || "Anonymous",
      rating,
      body: body.trim().slice(0, 1000),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    toast.success("Thanks for the review!");
  };

  return (
    <section id="community" className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquareQuote className="h-4 w-4 text-accent" /> Community Feedback
            </div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold">What students are saying</h2>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sticky top-24">
              <h3 className="font-display text-xl font-semibold">Leave a review</h3>
              {user ? (
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Display name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Rating</label>
                    <div className="mt-1"><Stars value={rating} onChange={setRating} /></div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Your review</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="How did youradviser help you?"
                      rows={4}
                      maxLength={1000}
                      required
                    />
                    <div className="mt-1 text-right text-[10px] text-muted-foreground">{body.length}/1000</div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting…</> : "Post review"}
                  </Button>
                </form>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Sign in to share your experience with the community.</p>
                  <Link to="/auth"><Button className="w-full">Sign in to review</Button></Link>
                </div>
              )}
            </div>
          </div>

          {/* Feed */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {comments.length === 0 && (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Be the first to share your experience.
              </div>
            )}
            {comments.map((c) => (
              <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                      {c.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{c.display_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <Stars value={c.rating} size={14} />
                </div>
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
