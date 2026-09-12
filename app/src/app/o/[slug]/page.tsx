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

export default function OrgHomePage() {
  const { slug } = useParams<{ slug: string }>();
  const [me, setMe] = useState<Me | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/org/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).then((res) => {
      if (res.status === 403 || res.status === 404) setNote("You cannot open this org.");
      return fetch(`/api/me?org=${slug}`);
    }).then((r) => r?.json()).then((data) => setMe(data));
  }, [slug]);

  const lessonHref = slug === "household" ? "/o/household/welcome" : slug === "sales" ? "/o/sales/welcome" : "/c/grok-bot";
  const canInvite = me?.member?.kind !== "child";
  const household = slug === "household";
  const sales = slug === "sales";

  async function invite() {
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: slug, email, stance: household ? "learner" : "learner" }),
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: childName }),
    });
    const data = await res.json();
    setNote(res.ok ? `Child ${data.child.name} added.` : data.error);
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
          <h2 className="font-display text-2xl">Add a child</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="Name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
            <Button onClick={() => void addChild()}>Create child</Button>
          </div>
        </section>
      ) : null}

      {note && note !== "You cannot open this org." ? (
        <p className="mt-6 text-sm text-pass">{note}</p>
      ) : null}
    </main>
  );
}
