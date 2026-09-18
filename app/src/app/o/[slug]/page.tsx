"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Me = {
  authenticated: boolean;
  activeOrg?: { slug: string; name: string; stance: string } | null;
  member?: { kind: string };
};

type ChildRow = {
  id: string;
  name: string;
  kind: string;
  membershipId: string;
  login: string;
  welcomeWatched: boolean;
  patternTitle: string | null;
  locked: boolean;
  note: string;
};

export default function OrgHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [me, setMe] = useState<Me | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [stance, setStance] = useState("");
  const [childName, setChildName] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch("/api/org/active", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ slug }),
    }).then((res) => {
      if (res.status === 403 || res.status === 404) setNote("You cannot open this org.");
      return fetch(`/api/me?org=${slug}`, { headers: { "x-fs-org": slug } });
    }).then((r) => r?.json()).then((data) => setMe(data));
  }, [slug]);

  const lessonHref = slug === "household" ? "/o/household/welcome" : slug === "sales" ? "/o/sales/welcome" : "/c/grok-bot";
  const canInvite =
    me?.member?.kind !== "child" &&
    ["admin", "guardian", "trainer"].includes(me?.activeOrg?.stance || "");
  const household = slug === "household";
  const sales = slug === "sales";
  const inviteStance = stance || (household ? "guardian" : sales ? "trainer" : "learner");
  const stanceOptions = household
    ? [
        { value: "guardian", label: "Guardian" },
        { value: "learner", label: "Learner" },
      ]
    : sales
      ? [
          { value: "trainer", label: "Trainer" },
          { value: "learner", label: "Learner" },
        ]
      : [{ value: "learner", label: "Learner" }];

  async function loadChildren() {
    if (slug !== "household") return;
    const res = await fetch("/api/children", { headers: { "x-fs-org": slug } });
    const data = await res.json();
    if (!res.ok) return;
    const rows = (data.children ?? []) as ChildRow[];
    setChildren(rows);
    const next: Record<string, string> = {};
    for (const row of rows) next[row.membershipId] = row.note || "";
    setNotes(next);
  }

  useEffect(() => {
    if (household && canInvite) void loadChildren();
    // loadChildren reads slug/household; canInvite is derived from me.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household, canInvite, slug]);

  async function invite() {
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ org: slug, email, stance: inviteStance }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(data.error || "Invite failed");
      return;
    }
    setInviteUrl(data.invite.url);
    setNote(`Invite created for ${email}`);
  }

  async function addChild() {
    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ name: childName }),
    });
    const data = await res.json();
    setNote(res.ok ? `Child ${data.child.name} added.` : data.error);
    if (res.ok) {
      setChildName("");
      await loadChildren();
    }
  }

  async function toggleLock(membershipId: string, locked: boolean) {
    const res = await fetch("/api/pattern/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ membership_id: membershipId, locked }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(
        data.error === "profile_required"
          ? "Child must take Field Pattern before you can lock the profile."
          : data.error || "Could not lock.",
      );
      return;
    }
    setNote(locked ? "Child profile locked." : "Child profile unlocked.");
    await loadChildren();
  }

  async function saveNote(membershipId: string) {
    const res = await fetch("/api/children", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-fs-org": slug },
      body: JSON.stringify({ membershipId, note: notes[membershipId] || "" }),
    });
    const data = await res.json();
    setNote(res.ok ? "Parent note saved." : data.error || "Could not save note.");
    if (res.ok) await loadChildren();
  }

  if (note === "You cannot open this org.") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">No access</h1>
        <p className="mt-3 text-muted-foreground">This org is invite-only.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {household ? "Household" : sales ? "Sales team" : slug}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {me?.activeOrg?.name || slug}
      </h1>
      <p className="mt-4 text-muted-foreground">
        {household
          ? "Private household campus. No Grok Bot catalog here."
          : sales
            ? "Sales desk. Pattern stays off this board."
            : "Operator catalog."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={lessonHref} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm text-primary-foreground">
          Open welcome
        </Link>
        {household ? (
          <Link href="/pattern" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
            Field Pattern
          </Link>
        ) : null}
        <Link href="/skills" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
          Skill diagnostic
        </Link>
      </div>

      {canInvite ? (
        <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl">Invite</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              value={inviteStance}
              onChange={(e) => setStance(e.target.value)}
            >
              {stanceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button onClick={() => void invite()}>Send invite</Button>
          </div>
          {inviteUrl ? (
            <p className="mt-3 text-sm">
              Share <Link href={inviteUrl} className="underline">{inviteUrl}</Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {household && canInvite ? (
        <section className="mt-6 rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl">Children</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Parent-facing list. Say child, not student. Kids have no own login.
            You record feedback and progress here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="Child name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
            <Button onClick={() => void addChild()}>Add a child</Button>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Child</th>
                  <th className="px-3 py-3 font-medium">Login</th>
                  <th className="px-3 py-3 font-medium">Welcome</th>
                  <th className="px-3 py-3 font-medium">Pattern</th>
                  <th className="px-3 py-3 font-medium">Parent note</th>
                </tr>
              </thead>
              <tbody>
                {children.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-muted-foreground" colSpan={5}>
                      No children yet.
                    </td>
                  </tr>
                ) : (
                  children.map((row) => (
                    <tr key={row.membershipId} className="border-t border-border">
                      <td className="px-3 py-3">
                        <p>{row.name}</p>
                        <p className="text-xs text-muted-foreground">Child</p>
                      </td>
                      <td className="px-3 py-3">None</td>
                      <td className="px-3 py-3">
                        {row.welcomeWatched ? "Watched" : "Not yet"}
                      </td>
                      <td className="px-3 py-3">
                        <p>{row.patternTitle || "Not run"}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.locked ? "Locked" : "Open"}
                        </p>
                        {row.patternTitle ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => void toggleLock(row.membershipId, !row.locked)}
                          >
                            {row.locked ? "Unlock profile" : "Lock profile"}
                          </Button>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[14rem] flex-col gap-2">
                          <textarea
                            className="min-h-16 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                            value={notes[row.membershipId] ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [row.membershipId]: e.target.value,
                              }))
                            }
                            placeholder="Feedback or progress"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void saveNote(row.membershipId)}
                          >
                            Save note
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {note && note !== "You cannot open this org." ? (
        <p className="mt-6 text-sm text-pass">{note}</p>
      ) : null}
    </main>
  );
}
