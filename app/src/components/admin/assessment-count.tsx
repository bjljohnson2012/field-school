"use client";

import { useEffect, useState } from "react";

type Snapshot = { status: "loading" } | { status: "ready"; count: number } | { status: "unavailable" };

function label(snapshot: Snapshot) {
  if (snapshot.status === "loading") return "assessments …";
  if (snapshot.status === "unavailable") return "assessments unavailable";
  return `${snapshot.count} assessments`;
}

/**
 * Durable assessment count for the member who owns this email.
 * The campus user id on /admin/users is not a members.id.
 */
export function AssessmentCount({ email }: { email: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ status: "loading" });

  useEffect(() => {
    const mail = email.trim();
    if (!mail) {
      setSnapshot({ status: "unavailable" });
      return;
    }
    const controller = new AbortController();
    setSnapshot({ status: "loading" });
    const url = `/api/admin/members/assessments?email=${encodeURIComponent(mail)}`;
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body: unknown = await response.json();
        if (typeof body !== "object" || body === null || !("count" in body)) throw new Error("unavailable");
        const count = body.count;
        if (typeof count !== "number" || !Number.isInteger(count) || count < 0) throw new Error("unavailable");
        setSnapshot({ status: "ready", count });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSnapshot({ status: "unavailable" });
      });
    return () => controller.abort();
  }, [email]);

  return <span data-assessment-count>{label(snapshot)}</span>;
}
