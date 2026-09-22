"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { canTeach } from "@/lib/composer/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  JOB,
  buildLessonSpec,
  draftUnits,
  formatLessonSpec,
  peopleOnDesk,
  substanceError,
  type Delivery,
  type DraftUnit,
  type OrgPerson,
  type SourceKind,
} from "./lesson-spec";

type Step = "what" | "substance" | "who" | "outcome" | "delivery" | "video" | "approve";
type Gate = "loading" | "guest" | "child" | "hirer" | "no-org" | "error" | "ready";

const QUESTIONS: Record<Step, number | null> = {
  what: 1,
  substance: 1,
  who: 2,
  outcome: 3,
  delivery: 4,
  video: 5,
  approve: null,
};

const PREVIOUS: Record<Step, Step | null> = {
  what: null,
  substance: "what",
  who: "substance",
  outcome: "who",
  delivery: "outcome",
  video: "delivery",
  approve: "video",
};

const KINDS: { value: SourceKind; title: string; detail: string }[] = [
  { value: "file", title: "A file", detail: "Something you already have." },
  { value: "link", title: "A link", detail: "We keep the address. We do not pull the page." },
  { value: "text", title: "Text", detail: "Words you paste. A blank line starts another unit." },
  { value: "idea", title: "An idea in your head", detail: "Say it in a few sentences." },
];

const DELIVERIES: { value: Delivery; title: string; detail: string }[] = [
  { value: "teach", title: "Teach live", detail: "You are in the room." },
  { value: "assign", title: "Self-serve", detail: "They keep moving when you are not in the room." },
  { value: "both", title: "Both", detail: "Teach it live, and they can take it when you leave." },
];

export function WizardClient() {
  const [gate, setGate] = useState<Gate>("loading");
  const [error, setError] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const [people, setPeople] = useState<OrgPerson[]>([]);
  const [step, setStep] = useState<Step>("what");
  const [kind, setKind] = useState<SourceKind | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [outcome, setOutcome] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [videoCut, setVideoCut] = useState<boolean | null>(null);
  const [units, setUnits] = useState<DraftUnit[]>([]);
  const [approved, setApproved] = useState<string[]>([]);
  const [specId] = useState(() => crypto.randomUUID());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const detailId = useId();
  const outcomeId = useId();

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const meRes = await fetch("/api/me");
        const me = await meRes.json();
        if (cancel) return;
        if (!me?.authenticated) {
          setGate("guest");
          return;
        }
        if (me.member?.kind === "child") {
          setGate("child");
          return;
        }
        if (!me.activeOrg?.slug) {
          setGate("no-org");
          return;
        }
        const stance = typeof me.activeOrg.stance === "string" ? me.activeOrg.stance : "";
        if (!canTeach({ kind: me.member?.kind ?? "adult", stance })) {
          setOrgName(me.activeOrg.name ?? me.activeOrg.slug);
          setGate("hirer");
          return;
        }
        const peopleRes = await fetch("/api/org/people");
        const peopleJson = await peopleRes.json();
        if (cancel) return;
        if (!peopleRes.ok) {
          setError(peopleJson.error || "Could not load people in this org.");
          setGate("error");
          return;
        }
        setOrgSlug(me.activeOrg.slug);
        setOrgName(me.activeOrg.name || me.activeOrg.slug);
        setPeople(Array.isArray(peopleJson.people) ? peopleJson.people : []);
        setGate("ready");
      } catch {
        if (!cancel) {
          setError("Could not load this org.");
          setGate("error");
        }
      }
    }
    void load();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, gate]);

  const desk = useMemo(() => peopleOnDesk(orgSlug, people), [orgSlug, people]);
  const labels = new Set(desk.people.map((person) => person.label));
  const mixed = desk.room === "held" || labels.size > 1;
  const chosen = desk.people.filter((person) => selected.includes(person.membershipId));

  const spec =
    gate === "ready" && kind && delivery && videoCut !== null
      ? buildLessonSpec({
          id: specId,
          org: orgSlug,
          title,
          outcome,
          delivery,
          videoCut,
          units,
          approvedUnitIds: approved,
        })
      : null;

  function chooseKind(next: SourceKind) {
    setKind(next);
    setDetail("");
    setDetailError(null);
    setStep("substance");
  }

  function continueSubstance() {
    if (!kind) return;
    const problem = substanceError(kind, title, detail);
    setDetailError(problem);
    if (problem) return;
    setStep("who");
  }

  function chooseDelivery(next: Delivery) {
    setDelivery(next);
    setStep("video");
  }

  function chooseVideo(cut: boolean) {
    if (!kind) return;
    setVideoCut(cut);
    setUnits(draftUnits({ kind, title, detail, nextId: () => crypto.randomUUID() }));
    setApproved([]);
    setStep("approve");
  }

  function togglePerson(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleUnit(id: string) {
    setApproved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const question = QUESTIONS[step];

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Library</p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{JOB}</p>

      {gate === "loading" ? <p className="mt-10 text-sm">Loading this org.</p> : null}

      {gate === "guest" ? (
        <section className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">
            Wizard
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sign in as the person accountable for this org.
          </p>
          <p className="mt-6">
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </section>
      ) : null}

      {gate === "child" ? (
        <section className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">
            Wizard
          </h1>
          <p className="mt-4 text-muted-foreground">
            A tracked child does not use this wizard. The person who owns the path does.
          </p>
        </section>
      ) : null}

      {gate === "hirer" ? (
        <section className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">
            Wizard
          </h1>
          <p className="mt-4 text-muted-foreground">
            This wizard is for the person accountable for people in {orgName || "this org"}.
          </p>
        </section>
      ) : null}

      {gate === "no-org" ? (
        <section className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">
            Wizard
          </h1>
          <p className="mt-4 text-muted-foreground">No org is selected.</p>
        </section>
      ) : null}

      {gate === "error" ? (
        <section className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">
            Wizard
          </h1>
          <p className="mt-4 text-muted-foreground">{error}</p>
        </section>
      ) : null}

      {gate === "ready" ? (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {orgName}
            {question ? ` · Question ${question} of 5` : " · Review"}
          </p>

          {step === "what" ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                What is this?
              </h1>
              <div className="mt-6 grid gap-3">
                {KINDS.map((item) => (
                  <Choice
                    key={item.value}
                    pressed={kind === item.value}
                    title={item.title}
                    detail={item.detail}
                    onClick={() => chooseKind(item.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "substance" && kind ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                {kind === "file"
                  ? "Name the file."
                  : kind === "link"
                    ? "Paste the link."
                    : kind === "text"
                      ? "Paste the text."
                      : "Say the idea."}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {kind === "link"
                  ? "We keep the address. We do not pull the page."
                  : "This name is the lesson in this org."}
              </p>
              <div className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm" htmlFor={titleId}>
                  Lesson name
                  <Input
                    id={titleId}
                    className="h-11"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                {kind === "file" ? (
                  <label className="grid gap-2 text-sm" htmlFor={detailId}>
                    File name
                    <Input
                      id={detailId}
                      className="h-11"
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                    />
                  </label>
                ) : null}
                {kind === "link" ? (
                  <label className="grid gap-2 text-sm" htmlFor={detailId}>
                    Link
                    <Input
                      id={detailId}
                      className="h-11"
                      inputMode="url"
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                    />
                  </label>
                ) : null}
                {kind === "text" || kind === "idea" ? (
                  <label className="grid gap-2 text-sm" htmlFor={detailId}>
                    {kind === "text" ? "Text" : "Idea"}
                    <Textarea
                      id={detailId}
                      className="min-h-36"
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                    />
                  </label>
                ) : null}
                {detailError ? <p className="text-sm text-destructive">{detailError}</p> : null}
                <Button className="h-11" type="button" onClick={continueSubstance}>
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === "who" ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                Who in this org is it for?
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {desk.room === "household"
                  ? "Tracked children only. Login stays none."
                  : desk.room === "team"
                    ? "Login learners only."
                    : "This desk will not mix tracked children and login learners."}
              </p>
              {mixed ? null : desk.people.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  {desk.room === "household"
                    ? "No tracked children in this org yet."
                    : "No login learners in this org yet."}
                </p>
              ) : (
                <div className="mt-6 grid gap-3">
                  {desk.people.map((person) => (
                    <Choice
                      key={person.membershipId}
                      pressed={selected.includes(person.membershipId)}
                      title={person.name}
                      detail={`${person.label}. Login: ${person.login === "none" ? "none" : "member"}.`}
                      onClick={() => togglePerson(person.membershipId)}
                    />
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button
                  className="h-11"
                  type="button"
                  disabled={chosen.length === 0}
                  onClick={() => setStep("outcome")}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === "outcome" ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                What should they be able to do after?
              </h1>
              <div className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm" htmlFor={outcomeId}>
                  Outcome
                  <Textarea
                    id={outcomeId}
                    className="min-h-28"
                    value={outcome}
                    onChange={(event) => setOutcome(event.target.value)}
                  />
                </label>
                <Button
                  className="h-11"
                  type="button"
                  disabled={!outcome.trim()}
                  onClick={() => setStep("delivery")}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === "delivery" ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                Teach live, self-serve, or both?
              </h1>
              <div className="mt-6 grid gap-3">
                {DELIVERIES.map((item) => (
                  <Choice
                    key={item.value}
                    pressed={delivery === item.value}
                    title={item.title}
                    detail={item.detail}
                    onClick={() => chooseDelivery(item.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "video" ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                Do you need a video cut?
              </h1>
              <div className="mt-6 grid gap-3">
                <Choice
                  pressed={videoCut === true}
                  title="Yes, a video cut"
                  detail="Mode on the spec becomes video."
                  onClick={() => chooseVideo(true)}
                />
                <Choice
                  pressed={videoCut === false}
                  title="No cut"
                  detail="Teach live and both record mode teach. Self-serve records mode assign."
                  onClick={() => chooseVideo(false)}
                />
              </div>
            </>
          ) : null}

          {step === "approve" && delivery && videoCut !== null ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl tracking-tight outline-none">
                Approve units
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                For {chosen.map((person) => person.name).join(", ") || "this org"}. Each check must
                cite source_unit_id. The spec stays hidden until you approve every unit.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                A video cut sets mode to video. Self-serve sets mode to assign. Teach live, and both
                without a cut, set mode to teach.
              </p>
              <ul className="mt-6 grid gap-3">
                {units.map((unit) => {
                  const on = approved.includes(unit.id);
                  return (
                    <li key={unit.id} className="rounded-xl border border-border bg-card px-4 py-4">
                      <p className="font-medium">{unit.title}</p>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        source_unit_id {unit.source_unit_id}
                      </p>
                      <Button
                        className="mt-4 h-11"
                        type="button"
                        variant={on ? "secondary" : "default"}
                        aria-pressed={on}
                        onClick={() => toggleUnit(unit.id)}
                      >
                        {on ? "Approved" : "Approve checks for this unit"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {spec ? (
                <div className="mt-8" aria-live="polite">
                  <h2 className="font-display text-2xl">LessonSpec</h2>
                  <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-xs leading-5">
                    {formatLessonSpec(spec)}
                  </pre>
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">Approve every unit to see the spec.</p>
              )}
            </>
          ) : null}

          {PREVIOUS[step] ? (
            <p className="mt-8">
              <button
                type="button"
                className="text-sm underline underline-offset-4"
                onClick={() => setStep(PREVIOUS[step] as Step)}
              >
                Back
              </button>
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function Choice({
  pressed,
  title,
  detail,
  onClick,
}: {
  pressed: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-4 text-left transition-colors",
        pressed ? "border-foreground bg-secondary" : "border-border bg-card hover:bg-secondary/70",
      )}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
    </button>
  );
}
