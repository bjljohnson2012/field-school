import { Check, Copy, Share2, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { courseShareText, courseShareUrl } from "@/lib/course/share";
import { cn } from "@/lib/utils";

export function ShareCourseButton({
  slug,
  title,
  compact = false,
  className,
}: {
  slug: string;
  title: string;
  compact?: boolean;
  className?: string;
}) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(courseShareUrl(window.location.origin, slug));
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (!url) return;
    const payload = {
      title,
      text: courseShareText(title),
      url,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "md-interactive inline-flex items-center justify-center gap-2 font-medium",
          compact
            ? "size-10 rounded-full border border-border bg-surface/90 text-fg"
            : "h-12 rounded-xl border border-border bg-surface px-5 text-sm text-fg",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void shareNative();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <Share2 className="size-4" />
        {compact ? <span className="sr-only">Share course</span> : "Share"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" />
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-[0_16px_40px_rgb(18_10_7_/_0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Share a link
                </p>
                <h2
                  id={`${dialogId}-title`}
                  className="mt-1 font-display text-2xl tracking-tight"
                >
                  Send this course
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Anyone with the link can open it as a guest. No account
                  required.
                </p>
              </div>
              <button
                type="button"
                className="md-interactive grid size-10 place-items-center rounded-full text-muted"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-5 block text-xs uppercase tracking-[0.16em] text-muted">
              Link
              <input
                className="md-field mt-2 h-12 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void copyLink()}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
