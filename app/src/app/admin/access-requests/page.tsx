"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/hooks/use-portal";
import { formatDay } from "@/lib/utils";
import type { AccessRequest } from "@/lib/members/types";

export default function AccessRequestsPage() {
  const { ready, isStaff } = usePortal();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !isStaff) return;
    let cancelled = false;
    fetch("/api/admin/access-requests")
      .then(async (res) => {
        const data = (await res.json()) as {
          requests?: AccessRequest[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(
            data.error ||
              "Access requests require a live staff Google or X session.",
          );
          return;
        }
        setRequests(data.requests ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load access requests.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, isStaff]);

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="eyebrow">Staff</p>
      <h1 className="h-page mt-2">Access requests</h1>
      <p className="mt-3 text-muted-foreground">
        Staff-desk asks and new free-beta enrollments. Adding someone to
        admin still means putting their email on{" "}
        <code className="text-xs">STAFF_ADMIN_EMAILS</code>.
      </p>

      {error ? (
        <p className="mt-6 rounded-brand border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        {requests.length === 0 && !error ? (
          <p className="rounded-card border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            No pending requests.
          </p>
        ) : null}
        {requests.map((request) => (
          <article
            key={request.id}
            className="card px-5 py-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="h-section">
                {request.name}
              </h2>
              <p className="eyebrow">
                {request.kind === "enrollment" ? "enrollment" : "staff"} ·{" "}
                {request.status}
              </p>
            </div>
            <p className="mt-2 text-sm">{request.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.provider} · {formatDay(request.createdAt)}
            </p>
            {request.note ? (
              <p className="mt-3 text-sm leading-relaxed">{request.note}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No note.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
