"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saas-dialog-title"
        className={`relative z-10 max-h-[min(40rem,calc(100dvh-2rem))] w-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-28px_rgba(26,25,22,0.55)] ${size === "lg" ? "max-w-2xl" : "max-w-lg"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="saas-dialog-title" className="font-display text-2xl tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
