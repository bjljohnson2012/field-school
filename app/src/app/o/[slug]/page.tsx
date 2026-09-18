"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChildrenDatabase } from "@/components/children-database";
import { canTeach } from "@/lib/composer/rules";

type Me = {
  authenticated: boolean;
  activeOrg?: { slug: string; name: string; stance: string } | null;
  member?: { kind: string };
};

export default function OrgHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [me, setMe] = useState<Me | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [stance, setStance] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

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
  const teacher = canTeach({
    kind: me?.member?.kind || "",
    stance: me?.activeOrg?.stance || "",
  });
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

  if (note === "You cannot open this org.") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">No access</h1>
        <p className="mt-3 text-muted-foreground">This org is invite-only.</p>
      </main>
    );
  }

  return (
    <main className={`mx-auto px-4 py-12 ${household ? "max-w-5xl" : "max-w-3xl"}`}>
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
          <>
            <Link href="/children" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
              Children database
            </Link>
            <Link href="/pattern" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
              Field Pattern
            </Link>
          </>
        ) : null}
        <Link href="/skills" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
          Skill diagnostic
        </Link>
        <Link href={`/o/${slug}/l`} className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
          Lessons
        </Link>
        {teacher ? (
          <Link href={`/o/${slug}/teach`} className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm">
            Teach
          </Link>
        ) : null}
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
        <div className="mt-6">
          <ChildrenDatabase />
        </div>
      ) : null}

      {note && note !== "You cannot open this org." ? (
        <p className="mt-6 text-sm text-pass">{note}</p>
      ) : null}
    </main>
  );
}
