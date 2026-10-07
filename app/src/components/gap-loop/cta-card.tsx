"use client";

import { useRef, useState } from "react";

export function CtaCard({
  task,
  emptyCopy,
  busy,
  onRespond,
}: {
  task: {
    id: string;
    question: string;
    requestCopy: string;
    channel: string;
    links: { href: string; label: string }[];
  } | null;
  emptyCopy: string;
  busy: boolean;
  onRespond: (body: Record<string, unknown>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");
  if (!task) {
    return (
      <section aria-label="Request" tabIndex={-1} className="rounded-2xl border border-border bg-card px-4 py-4 outline-none">
        <h2 className="text-sm font-semibold">Request</h2>
        <p className="mt-2 text-sm text-muted-foreground">{emptyCopy}</p>
      </section>
    );
  }
  const lesson = task.channel === "lesson";
  return (
    <section id="gap-request" aria-label="Request" tabIndex={-1} className="rounded-2xl border border-border bg-card px-4 py-4 outline-none">
      <h2 className="text-sm font-semibold">Request</h2>
      <p className="mt-2 text-sm font-medium">{task.question}</p>
      <p className="mt-1 text-sm text-muted-foreground">{task.requestCopy}</p>
      {lesson ? (
        <ul className="mt-3 space-y-1">
          {task.links.map((link) => (
            <li key={link.href}>
              <a className="text-sm underline underline-offset-2" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {task.channel === "rating" ? (
        <div className="mt-4">
          <p className="text-sm">How is this going?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["ready", "Ready"],
                ["getting_there", "Getting there"],
                ["not_yet", "Not yet"],
              ] as const
            ).map(([rating, label]) => (
              <button
                key={rating}
                type="button"
                className="rounded-full border border-border px-3 py-1 text-sm"
                disabled={busy}
                onClick={() => onRespond({ kind: "rating", rating, text: label })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onRespond({ kind: task.channel === "answer" || lesson ? "answer" : "paste", text });
          }}
        >
          <label className="text-xs text-muted-foreground" htmlFor="gap-answer">
            {lesson ? "Paste a worked example" : "Your answer"}
          </label>
          <textarea
            id="gap-answer"
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" className="rounded-full bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50" disabled={busy || !text.trim()}>
            Send
          </button>
        </form>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="rounded-full border border-border px-3 py-1 text-sm">
          Upload notes
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/pdf,text/plain,.txt,.md"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = String(reader.result || "");
                if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
                  const encoded = result.split(",")[1] || "";
                  onRespond({ kind: "pdf", filename: file.name, pdfBase64: encoded });
                } else {
                  onRespond({ kind: "upload", filename: file.name, text: result });
                }
              };
              if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) reader.readAsDataURL(file);
              else reader.readAsText(file);
            }}
          />
        </label>
        <button type="button" className="text-sm underline underline-offset-2" disabled={busy} onClick={() => onRespond({ kind: "decline", text: reason })}>
          Decline
        </button>
      </div>
      <label className="mt-3 block text-xs text-muted-foreground" htmlFor="decline-reason">
        Optional note if you decline
        <input
          id="decline-reason"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
    </section>
  );
}
