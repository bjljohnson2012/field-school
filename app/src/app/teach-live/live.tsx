"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeachDeck, type LessonSpec } from "@/components/teach-deck";
import { storedPortionForRoom } from "@/app/assign/next-portion";
import { chooseNextStep, nextStepTrail, personConfidence, type LivingBrain, type OutcomeMark } from "@/lib/living-brain/model";
import { lessonSpineConfidence, lessonSpineStep } from "@/lib/player/play-rail-write";

type Room = "household" | "sales";

type Assignment = {
  id: string;
  membershipId?: string;
  name: string;
  title: string;
  outcome: string;
  nextUnit?: string;
  nextUnitId?: string;
  login: "none" | "member";
  ownsPath?: boolean;
  buyer?: boolean;
  room: Room;
  units?: LessonSpec["units"];
  lessonId?: string;
};

type Desk =
  | { status: "loading" }
  | { status: "fixture" }
  | { status: "room"; room: Room; assignment: Assignment | null };

const SALES_FIXTURE: LessonSpec = {
  id: "spec-sales-next-step",
  org: "sales",
  title: "The next step while you are in the room",
  outcome: "The team member can name the next step and keep moving after this session ends.",
  mode: "teach",
  units: [
    { id: "unit-who-now", title: "Who they are now", source_unit_id: "src-who-now" },
    { id: "unit-next-step", title: "The next step that fits", source_unit_id: "src-next-step" },
    { id: "unit-after", title: "What still runs when you leave", source_unit_id: "src-after-you-leave" },
  ],
};

function LessonSpineAct(props: { title: string; login: "none" | "member" }) {
  const spine = lessonSpineStep(props.title);
  if (!spine) return null;
  return (
    <p
      className="mx-auto mt-4 max-w-6xl px-4 text-sm"
      data-lesson-spine-next={spine}
      data-next-from="outcomes"
      data-login={props.login}
    >
      <Link href="/play/lesson-spine">{spine}</Link>
      {props.login === "member"
        ? " The team member may sign in. The leader owns the path."
        : " The child has no login."}
    </p>
  );
}

function TeachBrainLabels(props: {
  room: Room;
  aim: string;
  confidence: string;
  membershipId: string;
  aimFrom?: "outcomes";
  confidenceFrom?: "outcomes";
}) {
  if (!props.aim && !props.confidence) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-4">
      {props.aim ? (
        <p className="text-sm" data-org-aim="yes" data-aim-from={props.aimFrom}>
          <span className="text-xs font-medium uppercase tracking-[0.12em]" data-aim-label="Aim">
            Aim
          </span>
          <span className="mt-1 block text-sm font-medium">
            {props.room === "sales" ? "What this team is aiming for" : "What this family is aiming for"}
          </span>
          <span className="mt-1 block text-muted-foreground">{props.aim}</span>
        </p>
      ) : null}
      {props.confidence ? (
        <p
          className="mt-4 text-sm text-muted-foreground"
          data-confidence={props.membershipId}
          data-confidence-from={props.confidenceFrom}
        >
          <span className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground" data-confidence-label="Confidence">
            Confidence
          </span>
          <span className="mt-1 block text-sm font-medium text-foreground">How they are doing</span>
          <span className="mt-1 block">{props.confidence}</span>
        </p>
      ) : null}
    </div>
  );
}

function roomOf(slug: string): Room | null {
  if (slug === "household" || slug === "sales") return slug;
  return null;
}

export function TeachLive() {
  const [desk, setDesk] = useState<Desk>({ status: "loading" });
  const [brainTitle, setBrainTitle] = useState("");
  const [brainTrail, setBrainTrail] = useState<OutcomeMark[]>([]);
  const [confidence, setConfidence] = useState("");
  const [aim, setAim] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/me")
      .then((response) => response.json())
      .then(async (me) => {
        const slug = typeof me?.activeOrg?.slug === "string" ? me.activeOrg.slug : "";
        const room = roomOf(slug);
        if (!room) {
          if (!cancelled) {
            setAim("");
            setConfidence("");
            setDesk({ status: "fixture" });
          }
          return;
        }
        const deskResponse = await fetch("/assign/desk", { headers: { "x-fs-org": room } });
        const data = await deskResponse.json();
        const rows = Array.isArray(data?.assignments) ? (data.assignments as Assignment[]) : [];
        const assignment = storedPortionForRoom(room, rows);
        const open =
          assignment && assignment.units && assignment.units.length > 0 ? assignment : null;
        let brain: LivingBrain | null = null;
        try {
          const brainResponse = await fetch("/api/living-brain");
          if (brainResponse.ok) {
            const brainData = (await brainResponse.json()) as { brain?: LivingBrain };
            brain = brainData.brain && brainData.brain.room === room ? brainData.brain : null;
          }
        } catch {
          brain = null;
        }
        const chosen = chooseNextStep({
          room,
          brain,
          storedTitle: open?.nextUnit,
          membershipId: open?.membershipId,
        });
        const samePerson = !open?.membershipId || chosen?.membershipId === open.membershipId;
        const onDesk = chosen && (room === "sales" ? chosen.login === "member" : chosen.login === "none");
        if (!cancelled) {
          setBrainTitle(samePerson && onDesk && chosen.from !== "stored" ? chosen.title : "");
          setBrainTrail(nextStepTrail({ room, brain, membershipId: open?.membershipId }));
          setAim(brain?.outcome || "");
          setConfidence(personConfidence({ room, brain, membershipId: open?.membershipId }));
          setDesk({ status: "room", room, assignment: open });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAim("");
          setConfidence("");
          setDesk({ status: "fixture" });
        }
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

  if (desk.status === "fixture") {
    return (
      <div data-sales-children="0">
        <TeachDeck spec={SALES_FIXTURE} />
      </div>
    );
  }

  const { room, assignment } = desk;
  const spineAim = lessonSpineStep(brainTitle);
  const spineConfidence = lessonSpineConfidence(brainTitle);
  const aimShown = aim || spineAim || "";
  const confidenceShown = spineConfidence || confidence;
  if (!assignment || !assignment.units || assignment.units.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10" data-teach-org={room} data-sales-children="0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teach live</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">No open path yet</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {room === "sales"
            ? "Assign a path to one team member first. They may sign in. You own the path. Their next step shows here after you return. This desk does not list children."
            : "Assign a path to one tracked child first. That child has no login. The next step shows here after you return."}
        </p>
        <TeachBrainLabels
          room={room}
          aim={aimShown}
          confidence={confidenceShown}
          membershipId=""
          aimFrom={!aim && spineAim ? "outcomes" : undefined}
          confidenceFrom={spineConfidence ? "outcomes" : undefined}
        />
        <LessonSpineAct title={brainTitle} login={room === "household" ? "none" : "member"} />
      </main>
    );
  }

  const startIndex = Math.max(
    0,
    assignment.units.findIndex((unit) => unit.id === assignment.nextUnitId),
  );
  const spec: LessonSpec = {
    id: assignment.lessonId || assignment.id,
    org: room,
    title: assignment.title,
    outcome: assignment.outcome,
    mode: "teach",
    units: assignment.units,
  };

  return (
    <div data-teach-org={room} data-login={room === "household" ? "none" : "member"} data-sales-children="0">
      <TeachDeck
        spec={spec}
        startIndex={startIndex < 0 ? 0 : startIndex}
        onArrive={(unitId) => {
          void fetch("/assign/next", {
            method: "POST",
            headers: { "content-type": "application/json", "x-fs-org": room },
            body: JSON.stringify({ assignmentId: assignment.id, unitId }),
          });
        }}
      />
      <p
        className="mx-auto max-w-6xl px-4 pb-10 text-sm text-muted-foreground"
        data-next-portion={brainTitle || assignment.nextUnit || ""}
        data-next-from={brainTitle ? "brain" : "stored"}
      >
        {room === "sales"
          ? `Next step for ${assignment.name} stays on Learn when the leader leaves and comes back. The team member may sign in. The leader owns the path.`
          : `Next step for ${assignment.name} stays on Learn when the parent leaves and comes back. The child has no login.`}
      </p>
      <LessonSpineAct title={brainTitle} login={room === "household" ? "none" : "member"} />
      <TeachBrainLabels
        room={room}
        aim={aimShown}
        confidence={confidenceShown}
        membershipId={assignment.membershipId || ""}
        aimFrom={!aim && spineAim ? "outcomes" : undefined}
        confidenceFrom={spineConfidence ? "outcomes" : undefined}
      />
      {brainTrail.length ? (
        <ol
          className="mx-auto max-w-6xl space-y-0.5 px-4 pb-10 text-xs text-muted-foreground"
          data-history={assignment.membershipId || ""}
          data-history-count={brainTrail.length}
        >
          {brainTrail.map((mark, index) => {
            const past = lessonSpineStep(mark.outcomes);
            return (
              <li key={`${index}-${mark.outcomes}`} data-lesson-spine-next={past || undefined}>
                {past ? <Link href="/play/lesson-spine">{past}</Link> : mark.outcomes}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
