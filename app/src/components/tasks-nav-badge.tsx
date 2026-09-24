"use client";

import { useEffect, useState } from "react";

const POLL_MS = 60_000;

export function TasksNavBadge({ fallback = 0 }: { fallback?: number }) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch("/api/coaching/tasks/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: unknown };
        const next = typeof data.count === "number" ? data.count : 0;
        if (!cancelled) setCount(next);
      } catch {
        /* keep the SSR fallback */
      }
    }
    void pull();
    const timer = setInterval(() => void pull(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <span className="grid min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-primary">
      {count}
    </span>
  );
}
