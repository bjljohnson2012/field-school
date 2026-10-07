"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CtaCard } from "@/components/gap-loop/cta-card";
import { GapChecklist } from "@/components/gap-loop/gap-checklist";
import { GoalBar, runStatus } from "@/components/gap-loop/goal-bar";
import { LoopTimeline } from "@/components/gap-loop/loop-timeline";
import { RequirementEditor, type DraftRequirement } from "@/components/gap-loop/requirement-editor";
import type { WorkspaceView } from "@/lib/gap-loop/view";

const SYSTEM = new Set(["draft", "analyze", "formulate", "integrate", "rescore"]);

const ERRORS: Record<string, string> = {
  sign_in_required: "Sign in to open this goal.",
  child_cannot_write: "A child membership cannot write a goal.",
  needs_response: "Send a response before the next step.",
  lease_held: "Another tab is running this step.",
  pdf_page_cap: "That PDF is over 12 pages.",
  pdf_unreadable: "That PDF could not be read.",
  upload_too_large: "That upload is too large.",
  rejected_without_new_evidence: "That finding stays closed until new evidence arrives.",
  database_unavailable: "Goals are not reachable right now.",
};

function runnerId() {
  const key = "gap-loop-runner";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

function emptyCopy(state: string) {
  if (state === "paused") return "Paused. Nothing runs until you resume.";
  if (state === "capped") return "Paused at your limit.";
  if (state === "stalled") return "Stuck. Change the goal, add material, or waive a requirement.";
  if (state === "done") return "This goal is met.";
  if (state === "cancelled") return "Archived. Saved material stays.";
  if (state === "waiting_on_user") return "No request right now. Waive a requirement, or add material when a request returns.";
  return "Working on the next step.";
}

export default function GoalWorkspacePage() {
  const params = useParams<{ outcomeId: string }>();
  const outcomeId = params.outcomeId;
  const [workspace, setWorkspace] = useState<WorkspaceView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"check" | "time">("check");
  const tokenRef = useRef("");
  const taskSeen = useRef("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/knowledge/outcomes/${outcomeId}`);
    const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<WorkspaceView>;
    if (!res.ok || !data.ok || !data.outcome || !data.run) {
      setError(ERRORS[data.error || ""] || "Could not open this goal.");
      return null;
    }
    const next = data as WorkspaceView;
    setWorkspace(next);
    return next;
  }, [outcomeId]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/knowledge/outcomes/${outcomeId}`)
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<WorkspaceView>;
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.outcome || !data.run) {
          setError(ERRORS[data.error || ""] || "Could not open this goal.");
          return;
        }
        setWorkspace(data as WorkspaceView);
      })
      .catch(() => {
        if (!cancelled) setError("Could not open this goal.");
      });
    return () => {
      cancelled = true;
    };
  }, [outcomeId]);

  const step = useCallback(
    async (run: WorkspaceView["run"]) => {
      const token = `${run.id}:${run.cycle}:${run.state}:${run.stepCount}`;
      if (tokenRef.current === token) return;
      tokenRef.current = token;
      setBusy(true);
      try {
        const res = await fetch(`/api/knowledge/outcomes/${outcomeId}/step`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": `${run.id}:${run.cycle}:${run.state}`,
            "x-runner-id": runnerId(),
          },
        });
        const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<WorkspaceView>;
        if (!res.ok || !data.ok || !data.run) {
          setError(ERRORS[data.error || ""] || "That step did not finish.");
          return;
        }
        setWorkspace(data as WorkspaceView);
        setError("");
      } catch {
        setError("That step did not finish.");
      } finally {
        setBusy(false);
      }
    },
    [outcomeId],
  );

  useEffect(() => {
    if (!workspace || !SYSTEM.has(workspace.run.state)) return;
    const run = workspace.run;
    const token = `${run.id}:${run.cycle}:${run.state}:${run.stepCount}`;
    if (tokenRef.current === token) return;
    tokenRef.current = token;
    let cancelled = false;
    void fetch(`/api/knowledge/outcomes/${outcomeId}/step`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": `${run.id}:${run.cycle}:${run.state}`,
        "x-runner-id": runnerId(),
      },
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<WorkspaceView>;
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.run) {
          setError(ERRORS[data.error || ""] || "That step did not finish.");
          return;
        }
        setError("");
        setWorkspace(data as WorkspaceView);
      })
      .catch(() => {
        if (!cancelled) setError("That step did not finish.");
      });
    return () => {
      cancelled = true;
    };
  }, [workspace, outcomeId]);

  useEffect(() => {
    const taskId = workspace?.task?.id || "";
    if (!taskId || taskSeen.current === taskId) return;
    taskSeen.current = taskId;
    document.getElementById("gap-request")?.focus();
  }, [workspace?.task?.id]);

  async function send(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json", "x-runner-id": runnerId() },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<WorkspaceView>;
      if (!res.ok || !data.ok) {
        setError(ERRORS[data.error || ""] || "That did not save.");
        return null;
      }
      if (data.run && data.outcome) setWorkspace(data as WorkspaceView);
      return data;
    } catch {
      setError("That did not save.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (!workspace) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">{error || "Loading this goal…"}</p>
      </main>
    );
  }

  const status = runStatus(workspace.run.state);
  const editor = workspace.run.state === "decompose";

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <p className="text-sm">
        <Link href="/knowledge/goals" className="underline underline-offset-2">
          All goals
        </Link>
      </p>
      <GoalBar
        title={workspace.outcome.title}
        statement={workspace.outcome.statement}
        state={workspace.run.state}
        coverageLabel={workspace.signals.now.coverageLabel}
        busy={busy}
        onPause={() => void send(`/api/knowledge/outcomes/${outcomeId}`, "PATCH", { action: "pause" })}
        onResume={() => void send(`/api/knowledge/outcomes/${outcomeId}`, "PATCH", { action: "resume" })}
        onArchive={() => void send(`/api/knowledge/outcomes/${outcomeId}`, "PATCH", { action: "archive" })}
      />
      <p className="sr-only" aria-live="polite">
        {status.word}. {workspace.signals.now.copy}
      </p>
      {error ? (
        <p className="text-sm" role="alert">
          {error}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              tokenRef.current = "";
              if (workspace) void step(workspace.run);
            }}
          >
            Retry
          </button>
        </p>
      ) : null}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3">
        <div className="order-1 lg:order-2">
          {editor ? (
            <RequirementEditor
              key={workspace.requirements.map((row) => row.id).join(",")}
              initial={workspace.requirements as DraftRequirement[]}
              busy={busy}
              onConfirm={(rows) => void send(`/api/knowledge/outcomes/${outcomeId}`, "PATCH", { action: "confirm", requirements: rows })}
            />
          ) : (
            <CtaCard
              task={workspace.task}
              emptyCopy={emptyCopy(workspace.run.state)}
              busy={busy}
              onRespond={async (body) => {
                if (!workspace.task) return;
                const saved = await send(`/api/knowledge/tasks/${workspace.task.id}/respond`, "POST", body);
                if (!saved) return;
                tokenRef.current = "";
                const fresh = await load();
                if (fresh && fresh.run.state === "waiting_on_user") await step(fresh.run);
              }}
            />
          )}
        </div>
        <div className="order-2 flex gap-2 lg:hidden" role="tablist" aria-label="Checklist or timeline">
          <button type="button" role="tab" aria-selected={tab === "check"} className={`rounded-full border px-3 py-1 text-sm ${tab === "check" ? "border-foreground bg-foreground text-background" : "border-border"}`} onClick={() => setTab("check")}>
            Checklist
          </button>
          <button type="button" role="tab" aria-selected={tab === "time"} className={`rounded-full border px-3 py-1 text-sm ${tab === "time" ? "border-foreground bg-foreground text-background" : "border-border"}`} onClick={() => setTab("time")}>
            Timeline
          </button>
        </div>
        <div className={`order-3 lg:order-1 ${tab === "check" ? "" : "hidden lg:block"}`}>
          <GapChecklist
            requirements={workspace.requirements}
            gaps={workspace.gaps}
            busy={busy}
            onReject={(gapId, reason) => void send(`/api/knowledge/gaps/${gapId}`, "PATCH", { action: "reject", reason })}
            onWaive={(gapId) => void send(`/api/knowledge/gaps/${gapId}`, "PATCH", { action: "waive" })}
            onReopen={(gapId) => void send(`/api/knowledge/gaps/${gapId}`, "PATCH", { action: "reopen" })}
          />
        </div>
        <div className={`order-4 lg:order-3 ${tab === "time" ? "" : "hidden lg:block"}`}>
          <LoopTimeline
            events={workspace.events}
            sources={workspace.sources}
            busy={busy}
            onDelete={async (nodeId) => {
              const saved = await send(`/api/knowledge/nodes/${nodeId}`, "DELETE");
              if (saved) await load();
            }}
          />
        </div>
      </div>
    </main>
  );
}
