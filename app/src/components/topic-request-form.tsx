"use client";

import { useState } from "react";

export function TopicRequestForm({ source = "/tools" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "topic_request",
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          message: String(data.get("message") || ""),
          website: String(data.get("website") || ""),
          source,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(payload.error || "Could not send that request.");
        return;
      }
      form.reset();
      setStatus("ok");
    } catch {
      setStatus("error");
      setError("Could not send that request.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="topic-website">Company</label>
        <input id="topic-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="topic-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="topic-name"
          name="name"
          required
          autoComplete="name"
          className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3"
        />
      </div>
      <div>
        <label htmlFor="topic-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="topic-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3"
        />
      </div>
      <div>
        <label htmlFor="topic-message" className="block text-sm font-medium">
          Topic you want covered
        </label>
        <textarea
          id="topic-message"
          name="message"
          required
          className="mt-1 min-h-28 w-full rounded-xl border border-border bg-background px-3 py-3"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Request this topic"}
      </button>
      {status === "ok" ? (
        <p className="text-sm text-muted-foreground">
          Got it. If it fits the week, it goes on the Saturday list or into a station.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
