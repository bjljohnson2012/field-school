"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { familyOperatorCopy, operatorLines, panelFromFamilyApis } from "@/lib/family/operator";
import {
  buildFamilySignals,
  type SignalIntent,
  type SignalPortion,
  type SignalUnit,
} from "@/lib/family/signals";

const HOUSEHOLD_HEADERS = { "x-fs-org": "household" } as const;

export type FamilyChild = {
  membershipId: string;
  name: string;
  login: string;
};

type LedgerUnit = SignalUnit & { id?: string; childMembershipId?: string };

export function FamilyV1Home({
  child,
  household,
  onSwitchChild,
  onChildSaved,
}: {
  child: FamilyChild | null;
  household: FamilyChild[];
  onSwitchChild: (membershipId: string) => void;
  onChildSaved: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [childName, setChildName] = useState(child?.name ?? "");
  const [intent, setIntent] = useState<SignalIntent>(null);
  const [pathItems, setPathItems] = useState<Array<{ title: string; subject?: string }>>([]);
  const [completed, setCompleted] = useState<LedgerUnit[]>([]);
  const [inProgress, setInProgress] = useState<LedgerUnit[]>([]);
  const [recommended, setRecommended] = useState<LedgerUnit[]>([]);
  const [units, setUnits] = useState<LedgerUnit[]>([]);
  const [portion, setPortion] = useState<SignalPortion>(null);
  const [locked, setLocked] = useState(false);
  const [intentDraft, setIntentDraft] = useState({
    goals: "",
    subjects: "",
    themes: "",
    timeHorizon: "",
    constraints: "",
  });
  const [intentVersion, setIntentVersion] = useState<number | null>(null);
  const [pathVersion, setPathVersion] = useState<number | null>(null);
  const [pathStatus, setPathStatus] = useState("");
  const [pathAccepted, setPathAccepted] = useState(false);

  useEffect(() => {
    setChildName(child?.name ?? "");
  }, [child?.name, child?.membershipId]);

  async function loadHome(membershipId: string) {
    const [intentRes, pathRes, portionRes, ledgerRes] = await Promise.all([
      fetch(`/api/intent?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
      fetch(`/api/curriculum?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
      fetch(`/api/portion?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
      fetch(`/api/ledger?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
    ]);
    const intentData = await intentRes.json();
    const pathData = await pathRes.json();
    const portionData = await portionRes.json();
    const ledgerData = await ledgerRes.json();

    const panel = panelFromFamilyApis({
      childName: child?.name || "this child",
      intent: intentRes.ok ? ((intentData.current as SignalIntent) ?? null) : null,
      path: pathRes.ok ? (pathData.current ?? null) : null,
      assigned: pathRes.ok ? (pathData.assigned ?? null) : null,
      portion: portionRes.ok ? ((portionData.current as SignalPortion) ?? null) : null,
      locked: portionRes.ok ? (portionData.locked ?? null) : null,
      ledger: ledgerRes.ok ? ledgerData : null,
    });
    setIntent(panel.intent);
    setIntentVersion(panel.intentVersion);
    setIntentDraft(panel.intentDraft);
    setPathItems(panel.pathItems);
    setPathVersion(panel.pathVersion);
    setPathStatus(panel.pathStatus);
    setPathAccepted(panel.pathAccepted);
    setPortion(panel.portion);
    setLocked(panel.portionLocked);
    setCompleted(panel.completed as LedgerUnit[]);
    setInProgress(panel.inProgress as LedgerUnit[]);
    setRecommended(panel.recommended as LedgerUnit[]);
    setUnits(panel.units as LedgerUnit[]);

    await Promise.all([
      fetch(`/api/brain?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
      fetch(`/api/brain/sync?child_membership_id=${encodeURIComponent(membershipId)}`, {
        headers: HOUSEHOLD_HEADERS,
      }),
    ]);
  }

  useEffect(() => {
    if (!child?.membershipId) return;
    void loadHome(child.membershipId);
  }, [child?.membershipId]);

  const signals = useMemo(
    () =>
      buildFamilySignals({
        childName: child?.name || "this child",
        intent,
        pathItems,
        completed,
        inProgress,
        recommended,
        units,
        portion,
        locked,
      }),
    [child?.name, intent, pathItems, completed, inProgress, recommended, units, portion, locked],
  );

  if (!child) return null;

  async function saveChildName() {
    const name = childName.trim();
    if (!name) {
      setNote("Child name is required.");
      return;
    }
    const res = await fetch("/api/children", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ membershipId: child.membershipId, name }),
    });
    const data = await res.json();
    setNote(res.ok ? `Child ${name} saved.` : data.error || "Could not save child.");
    if (res.ok) onChildSaved();
  }

  async function syncBrain() {
    await fetch("/api/brain/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ kind: "child", childMembershipId: child.membershipId }),
    }).catch(() => undefined);
  }

  async function markUnit(action: "start" | "complete", title: string) {
    if (!title) return;
    const res = await fetch("/api/ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: child.membershipId,
        action,
        title,
      }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? action === "complete"
          ? `${title} completed for ${child.name}.`
          : `${title} in play for ${child.name}.`
        : data.error || "Could not record unit.",
    );
    if (res.ok) {
      await syncBrain();
      await loadHome(child.membershipId);
    }
  }

  async function markConfidence(title: string, confidence: string, flag = "") {
    if (!title) return;
    const res = await fetch("/api/ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: child.membershipId,
        action: "confidence",
        title,
        confidence,
        flag,
      }),
    });
    const data = await res.json();
    setNote(res.ok ? `Parent confidence recorded for ${title}.` : data.error || "Could not record confidence.");
    if (res.ok) {
      await syncBrain();
      await loadHome(child.membershipId);
    }
  }

  async function markFlag(title: string, confidence: string, flag: string) {
    await markConfidence(title, confidence, flag);
  }

  async function saveIntent() {
    const res = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: child.membershipId,
        goals: operatorLines(intentDraft.goals),
        subjects: operatorLines(intentDraft.subjects),
        themes: operatorLines(intentDraft.themes),
        timeHorizon: intentDraft.timeHorizon,
        constraints: operatorLines(intentDraft.constraints),
      }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Intent v${data.version?.version ?? data.current?.version} saved.`
        : familyOperatorCopy(data.error, "Could not save intent."),
    );
    if (res.ok) await loadHome(child.membershipId);
  }

  async function proposePath() {
    const res = await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: child.membershipId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Path v${data.path?.version ?? data.current?.version} proposed for this child.`
        : familyOperatorCopy(data.error, "Could not propose path."),
    );
    if (res.ok) await loadHome(child.membershipId);
  }

  async function acceptPath() {
    const res = await fetch("/api/curriculum", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: child.membershipId, action: "accept" }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Path v${data.path?.version ?? data.current?.version} assigned to this child.`
        : familyOperatorCopy(data.error, "Could not accept path."),
    );
    if (res.ok) await loadHome(child.membershipId);
  }

  async function suggestPortion() {
    const res = await fetch("/api/portion", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: child.membershipId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Next portion v${data.portion?.version ?? data.current?.version} suggested for this child.`
        : familyOperatorCopy(data.error, "Could not suggest next portion."),
    );
    if (res.ok) await loadHome(child.membershipId);
  }

  async function lockPortion() {
    const res = await fetch("/api/portion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: child.membershipId, action: "lock" }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Next portion v${data.portion?.version ?? data.current?.version} locked for this child.`
        : familyOperatorCopy(data.error, "Could not lock next portion."),
    );
    if (res.ok) await loadHome(child.membershipId);
  }

  const playTargets = [...inProgress, ...recommended, ...signals.next.items].filter(
    (item, index, rows) => item.title && rows.findIndex((row) => row.title === item.title) === index,
  );

  return (
    <section className="mt-6 rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Child home</p>
          <h3 className="mt-1 font-display text-xl">{child.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Child · login none. Parent is operator. Signals hang on this child.
          </p>
        </div>
        <label className="text-sm">
          Switch child
          <select
            className="mt-1 block h-11 min-w-[12rem] rounded-xl border border-border bg-background px-3"
            value={child.membershipId}
            onChange={(event) => onSwitchChild(event.target.value)}
          >
            {household.map((row) => (
              <option key={row.membershipId} value={row.membershipId}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="h-11 min-w-[12rem] flex-1 rounded-xl border border-border bg-background px-3 text-sm"
          value={childName}
          onChange={(event) => setChildName(event.target.value)}
          placeholder="Child name"
          autoComplete="off"
        />
        <Button type="button" variant="outline" onClick={() => void saveChildName()}>
          Save child
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-border px-4 py-4">
        <h4 className="font-display text-lg">Plan for this child</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Parent writes intent, accepts a path, then locks the next portion. Child · login none.
        </p>
        <p className="mt-2 text-sm">
          Intent {intentVersion != null ? `v${intentVersion}` : "none"} · Path{" "}
          {pathAccepted
            ? `v${pathVersion} accepted`
            : pathStatus
              ? `v${pathVersion} ${pathStatus}`
              : "none"}{" "}
          · Portion {locked ? "locked" : "unlocked"}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Goals
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
              value={intentDraft.goals}
              onChange={(event) => setIntentDraft((prev) => ({ ...prev, goals: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Subjects
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
              value={intentDraft.subjects}
              onChange={(event) =>
                setIntentDraft((prev) => ({ ...prev, subjects: event.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Themes
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
              value={intentDraft.themes}
              onChange={(event) => setIntentDraft((prev) => ({ ...prev, themes: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Constraints
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
              value={intentDraft.constraints}
              onChange={(event) =>
                setIntentDraft((prev) => ({ ...prev, constraints: event.target.value }))
              }
            />
          </label>
          <label className="text-sm md:col-span-2">
            Time horizon
            <input
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
              value={intentDraft.timeHorizon}
              onChange={(event) =>
                setIntentDraft((prev) => ({ ...prev, timeHorizon: event.target.value }))
              }
              placeholder="this term"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void saveIntent()}>
            Save intent version
          </Button>
          <Button type="button" variant="outline" onClick={() => void proposePath()}>
            Propose path
          </Button>
          <Button type="button" variant="outline" onClick={() => void acceptPath()}>
            Accept path
          </Button>
          <Button type="button" variant="outline" onClick={() => void suggestPortion()}>
            Suggest next portion
          </Button>
          <Button type="button" variant="outline" onClick={() => void lockPortion()}>
            Lock portion
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border px-4 py-4">
          <h4 className="font-display text-lg">Now</h4>
          <p className="mt-2 text-sm">{signals.now.copy}</p>
          <p className="mt-3 text-sm text-muted-foreground">{signals.now.coverageLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">{signals.now.intentMatch}</p>
          {signals.now.completed.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Just complete: {signals.now.completed.slice(-2).join(", ")}
            </p>
          ) : null}
          {signals.now.revisit.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Revisit: {signals.now.revisit.join(", ")}
            </p>
          ) : null}
        </article>

        <article className="rounded-xl border border-border px-4 py-4">
          <h4 className="font-display text-lg">Confidence</h4>
          <p className="mt-2 text-sm">{signals.confidence.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Parent override wins. Not yet / Getting there / Ready only.
          </p>
          {signals.confidence.stuck.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Stuck: {signals.confidence.stuck.join(", ")}
            </p>
          ) : null}
          {signals.confidence.easy.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Easy: {signals.confidence.easy.join(", ")}
            </p>
          ) : null}
          <ol className="mt-3 space-y-3 text-sm">
            {units.map((unit) => (
              <li key={`conf-${unit.title}`}>
                <p>
                  {unit.title}
                  {unit.subject ? ` · ${unit.subject}` : ""}
                </p>
                <span className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["not_yet", "Not yet"],
                      ["getting_there", "Getting there"],
                      ["ready", "Ready"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={`${unit.title}-${value}`}
                      type="button"
                      variant={unit.confidence === value ? "default" : "outline"}
                      onClick={() => void markConfidence(unit.title, value, unit.flag || "")}
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={unit.flag === "stuck" ? "default" : "outline"}
                    onClick={() =>
                      void markFlag(unit.title, unit.confidence || "not_yet", unit.flag === "stuck" ? "" : "stuck")
                    }
                  >
                    Stuck
                  </Button>
                  <Button
                    type="button"
                    variant={unit.flag === "easy" ? "default" : "outline"}
                    onClick={() =>
                      void markFlag(unit.title, unit.confidence || "getting_there", unit.flag === "easy" ? "" : "easy")
                    }
                  >
                    Easy
                  </Button>
                </span>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-xl border border-border px-4 py-4">
          <h4 className="font-display text-lg">Next</h4>
          {signals.next.empty ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No next portion yet. Accept a path, then suggest a portion for {child.name}.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm">
                {signals.next.title || "Next portion"}
                {signals.next.locked ? " · locked" : ""}
              </p>
              {signals.next.reason ? (
                <p className="mt-2 text-sm text-muted-foreground">{signals.next.reason}</p>
              ) : null}
              <ol className="mt-3 space-y-3 text-sm">
                {playTargets.map((item) => (
                  <li key={`next-${item.title}`}>
                    <p>
                      {item.title}
                      {item.subject ? ` · ${item.subject}` : ""}
                    </p>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => void markUnit("start", item.title)}>
                        Play
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void markUnit("complete", item.title)}>
                        Complete
                      </Button>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </article>
      </div>
      <p className="sr-only">Now / Confidence / Next</p>
      {note ? <p className="mt-4 text-sm text-pass">{note}</p> : null}
    </section>
  );
}
