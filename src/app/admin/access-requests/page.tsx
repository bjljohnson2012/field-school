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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Access requests
      </h1>
      <p className="mt-3 text-muted-foreground">
        People who signed in as members and asked for the staff desk. Adding
        them still means putting their email on{" "}
        <code className="text-xs">STAFF_ADMIN_EMAILS</code>.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        {requests.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            No pending requests.
          </p>
        ) : null}
        {requests.map((request) => (
          <article
            key={request.id}
            className="rounded-xl border border-border bg-card px-5 py-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl tracking-tight">
                {request.name}
              </h2>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
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
