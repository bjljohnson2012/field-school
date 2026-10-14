"use client";

import { useEffect, useState } from "react";

type NextPayload = { title?: string; from?: string };

/** You reads enrollments. Living-brain text is only the fallback the API already applied. */
export function EnrollmentNext() {
  const [next, setNext] = useState<NextPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/brains/next-step", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as NextPayload;
        if (!cancelled) setNext(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!next?.title) return null;
  return (
    <p data-next-reader="enrollments" data-next-from={next.from || ""}>
      Next step: {next.title}
    </p>
  );
}
