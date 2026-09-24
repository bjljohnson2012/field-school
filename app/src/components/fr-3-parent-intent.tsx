"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type IntentChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  goals: string[];
  subjects: string[];
  themes: string[];
  timeHorizon: string;
  constraints: string[];
};

type IntentPayload = {
  ok?: boolean;
  launch?: string;
  distribute?: boolean;
  selected_child_id?: string;
  selected?: IntentChild | null;
  children?: Array<{ id: string; name: string }>;
};

function asLines(value: string[] | undefined) {
  return (value || []).join("\n");
}

export function Fr3ParentIntent() {
  const search = useSearchParams();
  const childParam = search.get("child")?.trim() || "";
  const [payload, setPayload] = useState<IntentPayload | null>(null);
  const [goals, setGoals] = useState("");
  const [subjects, setSubjects] = useState("");
  const [themes, setThemes] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [constraints, setConstraints] = useState("");
  const [saved, setSaved] = useState("");

  const selected = payload?.selected ?? null;
  const children = payload?.children ?? [];
  const selectedId = selected?.id || childParam;

  useEffect(() => {
    const query = childParam ? `?child=${encodeURIComponent(childParam)}` : "";
    fetch(`/api/progress/intent${query}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as IntentPayload;
        setPayload(body);
        const next = body.selected;
        if (!next) return;
        setGoals(asLines(next.goals));
        setSubjects(asLines(next.subjects));
        setThemes(asLines(next.themes));
        setTimeHorizon(next.timeHorizon || "");
        setConstraints(asLines(next.constraints));
        setSaved("");
      })
      .catch(() => setPayload(null));
  }, [childParam]);

  const childKind = useMemo(() => selected?.kind || "child", [selected]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    const res = await fetch("/api/progress/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        child: selectedId,
        goals,
        subjects,
        themes,
        timeHorizon,
        constraints,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as IntentPayload & { error?: string };
    if (!res.ok || !body.ok) {
      setSaved(body.error || "save_failed");
      return;
    }
    setPayload(body);
    const next = body.selected;
    if (next) {
      setGoals(asLines(next.goals));
      setSubjects(asLines(next.subjects));
      setThemes(asLines(next.themes));
      setTimeHorizon(next.timeHorizon || "");
      setConstraints(asLines(next.constraints));
    }
    setSaved("saved");
  }

  return (
    <section data-intent="fr-3-fr-2">
      <p className="eyebrow">
        Parent-owned intent
      </p>
      <h1 className="h-page mt-2">Intent under selected Child</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent captures and owns intent under the selected Child so path planning
        starts from parent intent, not child login. Child is not a User. Family
        LIVE chrome stays untouched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" data-child-picker="fr-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/intent?child=${encodeURIComponent(child.id)}`}
            data-child-id={child.id}
            data-child-selected={selected?.id === child.id ? "true" : "false"}
            className={
              selected?.id === child.id
                ? "inline-flex items-center rounded-brand border border-primary bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 ease-brand"
                : "inline-flex items-center rounded-brand border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 ease-brand"
            }
          >
            {child.name}
          </Link>
        ))}
      </div>

      {selected ? (
        <form
          className="card mt-8 grid gap-4 p-5"
          data-selected-child={selected.id}
          data-child-kind={childKind}
          data-child-login="none"
          data-child-user="false"
          onSubmit={onSave}
        >
          <p className="text-sm text-muted-foreground">
            Selected Child: {selected.name}. Kind {selected.kind}. Login none.
            Not a User.
          </p>
          <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
            Goals
            <textarea
              name="goals"
              data-intent-field="goals"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              className="input min-h-24"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
            Subjects
            <textarea
              name="subjects"
              data-intent-field="subjects"
              value={subjects}
              onChange={(event) => setSubjects(event.target.value)}
              className="input min-h-20"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
            Themes
            <textarea
              name="themes"
              data-intent-field="themes"
              value={themes}
              onChange={(event) => setThemes(event.target.value)}
              className="input min-h-20"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
            Time horizon
            <input
              name="timeHorizon"
              data-intent-field="timeHorizon"
              value={timeHorizon}
              onChange={(event) => setTimeHorizon(event.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
            Constraints
            <textarea
              name="constraints"
              data-intent-field="constraints"
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              className="input min-h-20"
            />
          </label>
          <button
            type="submit"
            data-intent-save="true"
            className="btn-primary w-fit"
          >
            Save parent intent
          </button>
          {saved ? (
            <p className="text-sm text-muted-foreground" data-intent-saved={saved}>
              {saved === "saved"
                ? "Parent intent saved under the selected Child."
                : saved}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Select a Child to set parent-owned intent.
        </p>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        After intent, assemble{" "}
        <Link href={selectedId ? `/path?child=${encodeURIComponent(selectedId)}` : "/path"} className="underline">
          /path
        </Link>
        , then see{" "}
        <Link href={selectedId ? `/progress?child=${encodeURIComponent(selectedId)}` : "/progress"} className="underline">
          /progress
        </Link>{" "}
        and{" "}
        <Link href="/play/lesson-spine" className="underline">
          /play/lesson-spine
        </Link>
        . Distribute held. Launch closed.
      </p>
    </section>
  );
}
