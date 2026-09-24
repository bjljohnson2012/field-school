"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type NoteItem = {
  id: string;
  body: string;
  visibleToLearner: boolean;
  createdAt: string;
};

export function NotesPanel({
  subjectMembershipId,
  notes,
  coach,
}: {
  subjectMembershipId: string;
  notes: NoteItem[];
  coach: boolean;
}) {
  const router = useRouter();
  const [visibleToLearner, setVisibleToLearner] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coaching/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectMembershipId, body, visibleToLearner }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save the note");
        return;
      }
      setBody("");
      setVisibleToLearner(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function flip(id: string, next: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/coaching/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToLearner: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update visibility");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="card p-6">
        <h2 className="h-section">Notes</h2>
        {notes.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No notes yet.</p> : null}
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-card border border-border p-4">
              <p className="text-sm text-foreground">{note.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.createdAt.slice(0, 10)}
                {note.visibleToLearner ? " · visible to learner" : " · hidden from learner"}
              </p>
              {coach ? (
                <button
                  type="button"
                  className="btn-primary mt-3"
                  disabled={busy}
                  onClick={() => void flip(note.id, !note.visibleToLearner)}
                >
                  {note.visibleToLearner ? "Hide from learner" : "Show to learner"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {coach ? (
        <section className="card p-6">
          <h2 className="h-section">New note</h2>
          <label className="label mt-4" htmlFor="note-body">
            Note
          </label>
          <textarea
            id="note-body"
            className="input"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={visibleToLearner}
              onChange={(event) => setVisibleToLearner(event.target.checked)}
            />
            Visible to learner
          </label>
          <button type="button" className="btn-primary mt-4" disabled={busy || !body.trim()} onClick={() => void save()}>
            Save note
          </button>
        </section>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
