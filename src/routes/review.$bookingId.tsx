import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Camera, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/review/$bookingId")({
  head: () => ({ meta: [{ title: "Leave a review — Tann Media" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const { bookingId } = Route.useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    (async () => {
      // Load booking details
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, client_name, package_name, category, session_date")
        .eq("id", bookingId)
        .maybeSingle();
      setBooking(bookingData);

      // Check if already reviewed
      if (bookingData) {
        const { data: existing } = await supabase
          .from("testimonials")
          .select("id")
          .eq("booking_id", bookingId)
          .maybeSingle();
        if (existing) setAlreadyReviewed(true);
      }

      setLoading(false);
    })();
  }, [bookingId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim()) return toast.error("Please share your experience");
    if (quote.trim().length < 10) return toast.error("Please write at least 10 characters");
    setSaving(true);

    const { error } = await supabase.from("testimonials").insert({
      client_name: booking?.client_name ?? "Anonymous",
      category: booking?.category ?? null,
      title: title.trim() || null,
      quote: quote.trim(),
      rating,
      booking_id: bookingId,
      is_approved: false,
      // NOTE: no user_id — testimonials table doesn't have this column
      // RLS policy allows unauthenticated inserts (run migration.sql to enable)
    });

    setSaving(false);

    if (error) {
      console.error("Review submission error:", error);
      // Give a helpful message based on the error
      if (error.message?.includes("user_id")) {
        toast.error("Review setup issue — please contact us directly. We'd love to hear from you!");
      } else if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.error("A review for this booking already exists.");
        setAlreadyReviewed(true);
      } else {
        toast.error(error.message);
      }
      return;
    }

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center">
          <Camera size={40} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="font-display text-3xl font-bold">Review link not found</h1>
          <p className="text-sm text-muted-foreground mt-3">
            This review link is invalid or has expired. Reach out and we'll send a new one.
          </p>
          <a href="https://wa.me/27815051466" target="_blank" rel="noreferrer"
            className="mt-6 inline-flex btn-lime px-5 py-2.5 rounded-md text-sm font-semibold">
            Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (alreadyReviewed && !submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center panel p-10">
          <CheckCircle2 size={56} className="mx-auto text-primary" />
          <h1 className="font-display text-3xl font-bold mt-4">Already reviewed!</h1>
          <p className="text-sm text-muted-foreground mt-3">
            A review for this booking has already been submitted. Thank you for your support! 🙏
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center panel p-10">
          <CheckCircle2 size={56} className="mx-auto text-primary" />
          <h1 className="font-display text-3xl font-bold mt-4">Thank you, {booking.client_name}!</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Your review has been submitted and will appear on the site once approved. 🎉
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic max-w-xs">"{quote}"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-10 bg-background">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <Camera size={16} />
          </span>
          <span className="font-display text-xl font-bold">Tann Media</span>
        </div>

        <span className="eyebrow">— Share your experience</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">
          How was your <span className="text-gradient-warm">experience?</span>
        </h1>

        {/* Session info */}
        <div className="mt-6 panel p-4 bg-secondary/40">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your session</div>
          <div className="font-semibold mt-1">{booking.client_name}</div>
          <div className="text-sm text-muted-foreground">
            {booking.package_name ?? booking.category ?? "Session"}
            {booking.session_date ? ` · ${new Date(booking.session_date + "T00:00:00").toLocaleDateString("en-ZA", {
              day: "numeric", month: "long", year: "numeric",
            })}` : ""}
          </div>
        </div>

        {/* Review form */}
        <form onSubmit={submit} className="mt-6 space-y-5 panel p-6">

          {/* Star rating */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Your rating *</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110">
                  <Star
                    size={36}
                    className={n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {rating === 5 ? "Excellent! 🌟" :
               rating === 4 ? "Great!" :
               rating === 3 ? "Good" :
               rating === 2 ? "Could be better" :
               "Poor"}
            </div>
          </div>

          {/* Title */}
          <label className="block">
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">
              Give your review a title <span className="font-normal opacity-60">(optional)</span>
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 60))}
              maxLength={60}
              placeholder="e.g. Magical wedding day photos"
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/60</div>
          </label>

          {/* Review text */}
          <label className="block">
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">
              Tell us about your experience *
            </div>
            <textarea
              value={quote}
              onChange={e => setQuote(e.target.value.slice(0, 400))}
              maxLength={400}
              rows={5}
              required
              placeholder="How was the shoot? How did the photographer make you feel? Would you recommend Tann Media?"
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{quote.length}/400</div>
          </label>

          <button
            type="submit"
            disabled={saving || !quote.trim()}
            className="w-full btn-lime px-5 py-3 rounded-md text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Star size={16} className="fill-current" />
                Submit Review
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Your review will appear on the website once approved by our team.
          </p>
        </form>
      </div>
    </div>
  );
}