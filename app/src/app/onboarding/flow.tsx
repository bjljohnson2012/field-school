"use client";

import { OnboardingProvider, useOnboarding } from "@onboardjs/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ADULT_GATES } from "@/lib/profile/model";
import { branchOf, KID_INTAKE, ONBOARDING_COPY, type FlowAction, type FlowSnapshot } from "@/lib/onboarding/graph";
import { m12EngineSteps } from "@/lib/onboarding/steps";
import { ORG_SWITCH_EVENT } from "@/lib/shell/model";

type Payload = {
  flow: FlowSnapshot;
  progress: { index: number; total: number; percent: number };
  rooms: readonly string[];
  roomLabels?: Record<string, string>;
  switcher: string;
  landing: string | null;
  kidIntake: { name: string; href: string };
};

function roomLabel(item: string, labels: Record<string, string> | undefined) {
  if (item === "family") return ONBOARDING_COPY.family;
  if (item === "team") return ONBOARDING_COPY.team;
  return labels?.[item] ?? "";
}

const primary =
  "h-12 w-full rounded-xl bg-[#1E4E8C] text-sm font-medium text-white motion-safe:transition-opacity motion-safe:duration-[240ms] motion-reduce:transition-none disabled:opacity-60";
const choice =
  "h-12 rounded-xl border border-[#8A8478] px-4 text-sm motion-safe:transition-colors motion-safe:duration-[240ms] motion-reduce:transition-none";

async function postFlow(action: FlowAction | null, entry?: string) {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action ? { action, entry } : { entry, type: "open" }),
  });
  const data = (await res.json()) as Payload & { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not save that step.");
  return data;
}

function refreshShell() {
  window.dispatchEvent(new Event(ORG_SWITCH_EVENT));
}

function Canvas({ payload, onPayload }: { payload: Payload; onPayload: (next: Payload) => void }) {
  const router = useRouter();
  const { state, goToStep } = useOnboarding();
  const flow = payload.flow;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [brainName, setBrainName] = useState(flow.brainName);
  const [orgName, setOrgName] = useState(flow.orgName);
  const [room, setRoom] = useState(flow.room ?? "family");
  const [homeschool, setHomeschool] = useState(flow.homeschoolMode === true);
  const [person, setPerson] = useState(flow.people[0]?.name ?? "");
  const [gates, setGates] = useState(flow.adultGates);
  const [kidName, setKidName] = useState(flow.people.find((item) => item.role === "child")?.name ?? "");
  const [aim, setAim] = useState(flow.aim);

  useEffect(() => {
    if (state?.currentStep?.id && state.currentStep.id !== flow.stepId) {
      void goToStep(String(flow.stepId));
    }
  }, [flow.stepId, goToStep, state?.currentStep?.id]);

  async function submit(action: FlowAction) {
    setPending(true);
    setError(null);
    try {
      const next = await postFlow(action);
      onPayload(next);
      if (action.type === "brain-name" || action.type === "org-name" || action.type === "room") refreshShell();
      if (next.landing) router.push(next.landing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that step.");
    } finally {
      setPending(false);
    }
  }

  const step = flow.stepId;
  return (
    <section
      data-step={step}
      data-onboardjs={state ? "ready" : "wait"}
      data-progress={payload.progress.percent}
      className="motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none"
    >
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5850]">
        {ONBOARDING_COPY.progress} {payload.progress.index} of {payload.progress.total}
      </p>
      <p className="mt-2 text-sm text-[#5C5850]" data-switcher-label={payload.switcher}>
        {payload.switcher}
      </p>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {step === "brain-name" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "brain-name", brainName });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.brainTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.brainBody}</p>
          <input
            className="h-12 w-full rounded-xl border border-[#8A8478] px-3"
            value={brainName}
            onChange={(event) => setBrainName(event.target.value)}
            aria-label={ONBOARDING_COPY.brainTitle}
            required
          />
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "room" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "room", room });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.roomTitle}</h1>
          <div className="grid grid-cols-2 gap-3" data-rooms={payload.rooms.join(",")}>
            {payload.rooms.map((item) => {
              const label = roomLabel(item, payload.roomLabels);
              if (!label) return null;
              return (
                <button
                  key={item}
                  type="button"
                  className={choice}
                  data-room={item}
                  aria-pressed={room === item}
                  onClick={() => {
                    if (item === "family" || item === "team" || item === "individual") setRoom(item);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "org-name" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "org-name", orgName });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.orgTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.orgBody}</p>
          <input
            className="h-12 w-full rounded-xl border border-[#8A8478] px-3"
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            aria-label={ONBOARDING_COPY.orgTitle}
            required
          />
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "homeschool-mode" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "homeschool-mode", homeschoolMode: homeschool });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.homeschoolTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.homeschoolBody}</p>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={homeschool} onChange={(event) => setHomeschool(event.target.checked)} />
            {ONBOARDING_COPY.homeschoolTitle}
          </label>
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "people" ? (
        <form
          className="mt-6 space-y-4"
          data-no-photo="true"
          onSubmit={(event) => {
            event.preventDefault();
            const family = flow.room !== "team";
            void submit({
              type: "people",
              people: [
                {
                  name: person,
                  role: family ? "child" : "member",
                  login: family ? "none" : "member",
                },
              ],
            });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">
            {flow.room === "team" ? ONBOARDING_COPY.peopleTeam : ONBOARDING_COPY.peopleFamily}
          </h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.peopleBody}</p>
          <input
            className="h-12 w-full rounded-xl border border-[#8A8478] px-3"
            value={person}
            onChange={(event) => setPerson(event.target.value)}
            aria-label="Name"
            required={flow.entry !== "invite"}
          />
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
          {flow.entry === "invite" ? (
            <button
              type="button"
              className="h-12 w-full rounded-xl border border-[#8A8478] text-sm"
              onClick={() => void submit({ type: "people", skip: true })}
            >
              {ONBOARDING_COPY.skip}
            </button>
          ) : null}
        </form>
      ) : null}

      {step === "adult-gates" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "adult-gates", gates });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.gatesTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.gatesBody}</p>
          <ul className="space-y-3">
            {ADULT_GATES.map((gate) => (
              <li key={gate.id} className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={gates[gate.id]}
                    onChange={(event) => setGates((current) => ({ ...current, [gate.id]: event.target.checked }))}
                  />
                  {gate.label}
                </label>
                {gate.href ? (
                  <a className="underline" href={gate.href}>
                    Open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "kid-intake" ? (
        <form
          className="mt-6 space-y-4"
          data-form-name={KID_INTAKE.name}
          data-no-photo="true"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "kid-intake", displayName: kidName });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.kidTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.kidBody}</p>
          <a className="text-sm underline" href={payload.kidIntake.href}>
            {payload.kidIntake.name}
          </a>
          <input
            className="h-12 w-full rounded-xl border border-[#8A8478] px-3"
            value={kidName}
            onChange={(event) => setKidName(event.target.value)}
            aria-label={KID_INTAKE.name}
            required
          />
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "first-goal" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "first-goal", aim });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.goalTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.goalBody}</p>
          <textarea
            className="min-h-28 w-full rounded-xl border border-[#8A8478] px-3 py-2"
            value={aim}
            onChange={(event) => setAim(event.target.value)}
            aria-label={ONBOARDING_COPY.goalTitle}
            required
          />
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}

      {step === "home-lesson" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ type: "home-lesson" });
          }}
        >
          <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.homeTitle}</h1>
          <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.homeBody}</p>
          <button className={primary} type="submit" disabled={pending}>
            {ONBOARDING_COPY.continue}
          </button>
        </form>
      ) : null}
    </section>
  );
}

export function OnboardingFlow() {
  const search = useSearchParams();
  const entry = search.get("entry") === "invite" ? "invite" : "signup";
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const steps = useMemo(() => m12EngineSteps(), []);

  useEffect(() => {
    let cancelled = false;
    void postFlow(null, entry)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open onboarding.");
      });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!payload?.flow) return <p className="text-sm text-[#5C5850]">Loading the next step.</p>;

  return (
    <OnboardingProvider
      steps={steps}
      flowId="m12-onboarding"
      flowName="M12 onboarding"
      initialStepId={payload.flow.stepId}
      initialContext={{ flowData: { ...branchOf(payload.flow) } }}
      analytics={{ enabled: false }}
      customOnDataLoad={async () => ({
        currentStepId: payload.flow.stepId,
        flowData: { ...branchOf(payload.flow) },
      })}
      customOnDataPersist={async () => {}}
    >
      <Canvas payload={payload} onPayload={setPayload} />
    </OnboardingProvider>
  );
}
