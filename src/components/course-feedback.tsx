import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import {
  getMyCourseFeedback,
  submitCourseFeedback,
} from "@/lib/course/campus";
import { cn } from "@/lib/utils";

/**
 * Post-course feedback. Only meaningful for signed-in learners (feedback is
 * tied to the account and surfaced to admins), so render it only when signed in.
 */
export function CourseFeedback({ courseSlug }: { courseSlug: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyCourseFeedback({ data: { courseSlug } })
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setRating(existing.rating);
          setComment(existing.comment);
          setSaved(true);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  async function submit() {
    if (rating < 1) {
      setError("Pick a star rating first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitCourseFeedback({ data: { courseSlug, rating, comment } });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="md-card rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Course feedback</p>
      <h2 className="mt-1 font-display text-xl tracking-tight">
        How was this course?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Your rating and notes go to the campus admins to improve the course.
      </p>
      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="md-interactive rounded p-1"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => {
              setRating(n);
              setSaved(false);
            }}
          >
            <Star
              className={cn(
                "size-6",
                (hover || rating) >= n
                  ? "fill-accent text-accent"
                  : "text-muted",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        className="md-field mt-3 min-h-24 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
        maxLength={4000}
        placeholder="What worked, what was confusing, what you'd add…"
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          setSaved(false);
        }}
      />
      {error ? <p className="mt-2 text-sm text-warn">{error}</p> : null}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !loaded}
          className="md-interactive inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {busy ? "Sending…" : saved ? "Update feedback" : "Send feedback"}
        </button>
        {saved && !busy ? (
          <span className="text-sm text-pass">Thanks — saved.</span>
        ) : null}
      </div>
    </section>
  );
}
