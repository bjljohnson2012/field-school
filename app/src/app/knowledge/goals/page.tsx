"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

type Outcome = { id: string; title: string; statement: string; status: string; ownerKind: string };
type Child = { membershipId: string; name: string };
type ScopeName = "person" | "child" | "family" | "team" | "org";

const SCOPE_COPY: Record<ScopeName, string> = {
  person: "Me",
  child: "A child in this household",
  family: "This family",
  team: "This team",
  org: "This organization",
};

function goalKind(kind: string) {
  if (kind === "child") return "Child goal";
  if (kind === "family") return "Family goal";
  if (kind === "team") return "Team goal";
  if (kind === "org") return "Organization goal";
  return "Your goal";
}

const ERRORS: Record<string, string> = {
  sign_in_required: "Sign in to set a goal.",
  child_cannot_write: "A child membership cannot write a goal.",
  sales_room_cannot_create_child_goal: "The sales room cannot create a child goal.",
  sales_room_cannot_create_family_goal: "The sales room cannot create a family goal.",
  household_cannot_create_team_goal: "A household cannot create a team goal.",
  team_leader_only: "A team leader sets a team goal.",
  org_leader_only: "A leader sets an organization goal.",
  household_guardian_only: "A household guardian sets a child goal.",
  statement_required: "Write the goal in a sentence.",
  child_membership_id_required: "Choose a child.",
  child_not_in_org: "That child is not in this household.",
  database_unavailable: "Goals are not reachable right now.",
};

function GoalsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [childGoals, setChildGoals] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [statement, setStatement] = useState("");
  const [horizon, setHorizon] = useState("");
  const [childId, setChildId] = useState(params.get("child") || "");
  const [scopes, setScopes] = useState<ScopeName[]>(["person"]);
  const [scope, setScope] = useState<ScopeName>(params.get("scope") === "child" ? "child" : "person");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let gone = false;
    fetch("/api/knowledge/outcomes")
      .then((res) => res.json())
      .then((data: { ok?: boolean; error?: string; outcomes?: Outcome[]; childGoals?: boolean; scopes?: ScopeName[] }) => {
        if (gone) return;
        if (!data.ok) {
          setError(ERRORS[data.error || ""] || "Could not load goals.");
          return;
        }
        setOutcomes(data.outcomes || []);
        setChildGoals(Boolean(data.childGoals));
        const allowed = (data.scopes || ["person"]).filter((item): item is ScopeName => item in SCOPE_COPY);
        setScopes(allowed.length ? allowed : ["person"]);
        if (!data.childGoals && scope === "child") setScope("person");
      })
      .catch(() => {
        if (!gone) setError("Could not load goals.");
      });
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    if (!childGoals) return;
    let gone = false;
    fetch("/api/children")
      .then((res) => res.json())
      .then((data: { children?: { membershipId?: string; name?: string }[] }) => {
        if (gone) return;
        const rows = (data.children || [])
          .filter((row) => row.membershipId && row.name)
          .map((row) => ({ membershipId: row.membershipId as string, name: row.name as string }));
        setChildren(rows);
        if (!childId && rows[0]) setChildId(rows[0].membershipId);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [childGoals, childId]);

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/knowledge/outcomes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerKind: scope,
          statement,
          horizon,
          childMembershipId: scope === "child" ? childId : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; outcome?: { id: string } };
      if (!res.ok || !data.outcome) {
        setError(ERRORS[data.error || ""] || "Could not save that goal.");
        return;
      }
      router.push(`/knowledge/goals/${data.outcome.id}`);
    } catch {
      setError("Could not save that goal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Knowledge</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Goals</h1>
      <p className="mt-3 text-sm text-muted-foreground">Set a goal. The loop finds what is missing and asks for one thing at a time.</p>
      <form onSubmit={createGoal} className="mt-6 space-y-3 rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="text-sm font-semibold">Set a goal</h2>
        {scopes.length > 1 ? (
          <fieldset className="space-y-2">
            <legend className="text-xs text-muted-foreground">Who is this for?</legend>
            {scopes.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="radio" name="scope" checked={scope === item} onChange={() => setScope(item)} />
                {SCOPE_COPY[item]}
              </label>
            ))}
          </fieldset>
        ) : null}
        {scope === "child" && childGoals ? (
          <label className="block text-sm">
            Child
            <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" value={childId} onChange={(event) => setChildId(event.target.value)}>
              {children.map((child) => (
                <option key={child.membershipId} value={child.membershipId}>
                  {child.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-sm" htmlFor="goal-statement">
          Goal
          <textarea
            id="goal-statement"
            className="mt-1 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2"
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm" htmlFor="goal-horizon">
          By when
          <input
            id="goal-horizon"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            value={horizon}
            onChange={(event) => setHorizon(event.target.value)}
          />
        </label>
        <button type="submit" className="rounded-full bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50" disabled={busy}>
          Set a goal
        </button>
        {error ? (
          <p className="text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      <ul className="mt-6 space-y-3">
        {outcomes.map((outcome) => (
          <li key={outcome.id} className="rounded-2xl border border-border px-4 py-3">
            <Link href={`/knowledge/goals/${outcome.id}`} className="text-sm font-medium underline underline-offset-2">
              {outcome.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {goalKind(outcome.ownerKind)} · {outcome.status}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted-foreground">Loading goals…</p>}>
      <GoalsPage />
    </Suspense>
  );
}
