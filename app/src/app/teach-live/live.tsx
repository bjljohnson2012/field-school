"use client";

import { useEffect, useState } from "react";
import { TeachDeck, type LessonSpec } from "@/components/teach-deck";

const SALES_LESSON: LessonSpec = {
  id: "spec-sales-next-step",
  org: "sales",
  title: "The next step while you are in the room",
  outcome:
    "The teammate can name the next step on their path and keep moving after this session ends.",
  mode: "teach",
  units: [
    { id: "unit-who-now", title: "Who they are now", source_unit_id: "src-who-now" },
    { id: "unit-next-step", title: "The next step that fits", source_unit_id: "src-next-step" },
    { id: "unit-after", title: "What still runs when you leave", source_unit_id: "src-after-you-leave" },
  ],
};

type Assignment = {
  id: string;
  name: string;
  title: string;
  outcome: string;
  nextUnitId?: string;
  login: "none" | "member";
  room: "household" | "sales";
  units?: LessonSpec["units"];
  lessonId?: string;
};

type Desk =
  | { status: "loading" }
  | { status: "sales" }
  | { status: "household"; assignment: Assignment | null };

export function TeachLive() {
  const [desk, setDesk] = useState<Desk>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/me")
      .then((response) => response.json())
      .then(async (me) => {
        const slug = typeof me?.activeOrg?.slug === "string" ? me.activeOrg.slug : "";
        if (slug !== "household") {
          if (!cancelled) setDesk({ status: "sales" });
          return;
        }
        const deskResponse = await fetch("/assign/desk", { headers: { "x-fs-org": "household" } });
        const data = await deskResponse.json();
        const rows = Array.isArray(data?.assignments) ? (data.assignments as Assignment[]) : [];
        const assignment =
          rows.find((row) => row.room === "household" && row.login === "none" && row.units && row.units.length > 0) ||
          null;
        if (!cancelled) setDesk({ status: "household", assignment });
      })
      .catch(() => {
        if (!cancelled) setDesk({ status: "sales" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (desk.status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading this lesson.</p>
      </main>
    );
  }

  if (desk.status === "sales") {
    return (
      <div data-sales-children="0">
        <TeachDeck spec={SALES_LESSON} />
      </div>
    );
  }

  const assignment = desk.assignment;
  if (!assignment || !assignment.units || assignment.units.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10" data-teach-org="household" data-login="none">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teach live</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">No open path yet</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Assign a path to one tracked child first. That child has no login. The next portion shows here after you return.
        </p>
      </main>
    );
  }

  const startIndex = Math.max(
    0,
    assignment.units.findIndex((unit) => unit.id === assignment.nextUnitId),
  );
  const spec: LessonSpec = {
    id: assignment.lessonId || assignment.id,
    org: "household",
    title: assignment.title,
    outcome: assignment.outcome,
    mode: "teach",
    units: assignment.units,
  };

  return (
    <div data-teach-org="household" data-login="none" data-sales-children="0">
      <TeachDeck
        spec={spec}
        startIndex={startIndex < 0 ? 0 : startIndex}
        onArrive={(unitId) => {
          void fetch("/assign/next", {
            method: "POST",
            headers: { "content-type": "application/json", "x-fs-org": "household" },
            body: JSON.stringify({ assignmentId: assignment.id, unitId }),
          });
        }}
      />
      <p className="mx-auto max-w-6xl px-4 pb-10 text-sm text-muted-foreground" data-next-portion="">
        Next portion for {assignment.name} stays on Learn when you leave and return. Login none.
      </p>
    </div>
  );
}
