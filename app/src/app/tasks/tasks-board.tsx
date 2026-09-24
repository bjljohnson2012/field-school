"use client";

import { useState } from "react";

export type TaskItem = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  assigneeMembershipId: string;
  authorMembershipId: string;
  subjectMembershipId: string | null;
  assigneeName: string;
  dueAt: string | null;
  createdAt: string;
};

export type AssigneeChoice = {
  id: string;
  name: string;
  stance: string;
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; description?: string; tasks?: TaskItem[]; task?: TaskItem };
  return { res, data };
}

export function TasksBoard({
  initialTasks,
  assignees,
  actorMembershipId,
  admin,
}: {
  initialTasks: TaskItem[];
  assignees: AssigneeChoice[];
  actorMembershipId: string;
  admin: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [assigneeMembershipId, setAssigneeMembershipId] = useState(actorMembershipId);
  const [subjectMembershipId, setSubjectMembershipId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const res = await fetch("/api/coaching/tasks", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { tasks?: TaskItem[] };
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
  }

  async function createTask() {
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/coaching/tasks", {
        title,
        body,
        assigneeMembershipId,
        subjectMembershipId: subjectMembershipId.trim() || null,
      });
      if (!res.ok) {
        setError(data.error || "Could not create the task");
        return;
      }
      setTitle("");
      setBody("");
      setSubjectMembershipId("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function draftDescription() {
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/coaching/tasks/describe", {
        title,
        assigneeMembershipId,
      });
      if (!res.ok) {
        setError(data.error || "Could not draft a description");
        return;
      }
      if (typeof data.description === "string") setBody(data.description);
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/coaching/tasks/generate", {
        assigneeMembershipId,
        count: 3,
      });
      if (!res.ok) {
        setError(data.error || "Could not generate tasks");
        return;
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/coaching/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update the task");
        return;
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="card p-6">
        <h2 className="h-section">Open work</h2>
        {tasks.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No open tasks.</p> : null}
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => {
            const assignee = task.assigneeMembershipId === actorMembershipId;
            const author = task.authorMembershipId === actorMembershipId;
            const progress = assignee || author;
            return (
              <li key={task.id} className="rounded-card border border-border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{task.title}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{task.status}</span>
                </div>
                {task.body ? <p className="mt-2 text-sm text-muted-foreground">{task.body}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {task.assigneeName}
                  {task.dueAt ? ` · due ${task.dueAt.slice(0, 10)}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress && task.status === "open" ? (
                    <button type="button" className="btn-primary" disabled={busy} onClick={() => void setStatus(task.id, "in_progress")}>
                      Start
                    </button>
                  ) : null}
                  {progress && task.status === "in_progress" ? (
                    <button type="button" className="btn-primary" disabled={busy} onClick={() => void setStatus(task.id, "done")}>
                      Done
                    </button>
                  ) : null}
                  {(author || admin) && (task.status === "open" || task.status === "in_progress") ? (
                    <button type="button" className="btn" disabled={busy} onClick={() => void setStatus(task.id, "cancelled")}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="h-section">New task</h2>
          <label className="label mt-4" htmlFor="task-title">
            Title
          </label>
          <input id="task-title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          <label className="label mt-3" htmlFor="task-assignee">
            Assignee
          </label>
          <select
            id="task-assignee"
            className="input"
            value={assigneeMembershipId}
            onChange={(event) => setAssigneeMembershipId(event.target.value)}
          >
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.stance})
              </option>
            ))}
          </select>
          <label className="label mt-3" htmlFor="task-subject">
            Subject membership
          </label>
          <input
            id="task-subject"
            className="input"
            value={subjectMembershipId}
            placeholder="Optional"
            onChange={(event) => setSubjectMembershipId(event.target.value)}
          />
          <label className="label mt-3" htmlFor="task-body">
            Description
          </label>
          <textarea id="task-body" className="input" rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void createTask()}>
              Add task
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => void draftDescription()}>
              Draft description
            </button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="h-section">Generate</h2>
          <p className="mt-2 text-sm text-muted-foreground">Write the next tasks for the selected assignee and save them.</p>
          <button type="button" className="btn-primary mt-4" disabled={busy} onClick={() => void generate()}>
            Generate
          </button>
        </section>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
