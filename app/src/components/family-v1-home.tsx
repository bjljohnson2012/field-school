"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

    setIntent(
      intentRes.ok
        ? ((intentData.current as SignalIntent) ?? null)
        : null,
    );
    const assigned = pathData.assigned ?? pathData.current;
    setPathItems(pathRes.ok ? ((assigned?.items ?? []) as Array<{ title: string; subject?: string }>) : []);
    if (portionRes.ok) {
      const current = (portionData.locked ?? portionData.current ?? null) as SignalPortion;
      setPortion(current);
      setLocked(Boolean(portionData.locked));
    } else {
      setPortion(null);
      setLocked(false);
    }
    if (ledgerRes.ok) {
      const done = (ledgerData.completed ?? []) as LedgerUnit[];
      const running = (ledgerData.inProgress ?? []) as LedgerUnit[];
      const next = (ledgerData.recommended ?? []) as LedgerUnit[];
      setCompleted(done);
      setInProgress(running);
      setRecommended(next);
      setUnits((ledgerData.current?.units ?? [...done, ...running, ...next]) as LedgerUnit[]);
    } else {
      setCompleted([]);
      setInProgress([]);
      setRecommended([]);
      setUnits([]);
    }

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
