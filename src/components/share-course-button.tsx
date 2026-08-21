import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { courseShareText, courseShareUrl } from "@/lib/course/share";
import { cn } from "@/lib/utils";

/**
 * Simple share control: native share when available, otherwise copy the
 * plain /c/{slug} URL. No image card, no campaign params.
 */
export function ShareCourseButton({
  slug,
  title,
  className,
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(courseShareUrl(window.location.origin, slug));
  }, [slug]);

  async function onShare() {
    if (!url) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: courseShareText(title),
          url,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void onShare();
      }}
      className={cn(
        "inline-flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm text-fg transition-colors hover:bg-raised",
        className,
      )}
      aria-label={copied ? "Link copied" : "Share course link"}
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? "Copied" : "Share link"}
      <Copy className="sr-only size-4" />
    </button>
  );
}
