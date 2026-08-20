import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { listCampusThread, sendCampusMessage } from "@/lib/course/campus";

type ThreadMessage = {
  id: number;
  body: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
  mine: boolean;
};

export function CampusChat({
  studentId,
  emptyHint,
}: {
  studentId?: string;
  emptyHint: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[] | null>(null);
  const [title, setTitle] = useState("Campus office");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const thread = await listCampusThread({ data: { studentId } });
    setTitle(
      thread.faculty
        ? `${thread.student.name}${thread.student.email ? ` · ${thread.student.email}` : ""}`
        : "Message the dean",
    );
    setMessages(thread.messages);
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    refresh().catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Could not open the thread.");
      setMessages([]);
    });
    const timer = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendCampusMessage({ data: { body: draft, studentId } });
      setDraft("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message did not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Inbox</p>
        <h2 className="mt-1 font-display text-xl tracking-tight">{title}</h2>
      </header>
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="text-sm text-muted">Loading the thread…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">{emptyHint}</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[36rem] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                message.mine
                  ? "ml-auto bg-accent text-accent-fg"
                  : "bg-raised text-fg"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.12em] opacity-80">
                {message.authorName}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
            </article>
          ))
        )}
      </div>
      <form className="border-t border-border p-3" onSubmit={(e) => void onSend(e)}>
        {error ? <p className="mb-2 text-sm text-warn">{error}</p> : null}
        <div className="flex gap-2">
          <textarea
            className="md-field min-h-11 flex-1 resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm"
            rows={2}
            maxLength={4000}
            placeholder="Write the dean…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="md-interactive h-11 self-end rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
