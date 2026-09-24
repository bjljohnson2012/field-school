"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Status = "idle" | "generating" | "ready" | "failed" | string;

export function SynthesisStatusBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let previous: Status | null = null;
    const tick = async () => {
      try {
        const res = await fetch("/api/coaching/synthesis", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          synthesis_status?: Status;
          synthesis_error?: string | null;
        };
        if (cancelled) return;
        const next = data.synthesis_status ?? "idle";
        setStatus(next);
        setError(typeof data.synthesis_error === "string" ? data.synthesis_error : null);
        if (previous === "generating" && next === "ready") router.refresh();
        previous = next;
      } catch {
        /* the next poll retries */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  if (status !== "generating" && status !== "failed") return null;

  if (status === "generating") {
    return (
      <section className="card mb-6 border-l-4 border-brand-orange px-5 py-4" aria-live="polite">
        <div className="font-display font-semibold">Generating your profile</div>
        <p className="mt-1 text-sm text-gray-600">
          Your answers are saved. This page checks again every few seconds.
        </p>
      </section>
    );
  }

  return (
    <section className="card mb-6 border-l-4 border-red-500 px-5 py-4" aria-live="polite">
      <div className="font-display font-semibold">Synthesis failed</div>
      <p className="mt-1 text-sm text-gray-600">Your answers are saved.</p>
      {error ? <p className="mt-2 text-xs text-gray-500">{error.slice(0, 300)}</p> : null}
    </section>
  );
}
