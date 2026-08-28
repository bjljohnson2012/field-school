"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/lib/campus";
import { courseTally, impersonate, updateUser, workspaceFor } from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";
import { formatDay } from "@/lib/utils";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { users, isAdmin, isStaff, ready } = usePortal();
  const person = users.find((u) => u.id === id);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState<string | null>(null);

  if (person && hydrated !== person.id) {
    setHydrated(person.id);
    setName(person.name);
    setEmail(person.email);
    setRole(person.role);
    setTitle(person.title);
    setNotes(person.notes);
    setSaved(false);
  }

  if (ready && !isStaff) return null;

  if (ready && !person) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-muted-foreground">No one with that id.</p>
        <Link href="/admin/users" className="mt-4 inline-flex text-sm">
          Back to users
        </Link>
      </main>
    );
  }

  const ws = person ? workspaceFor(person.id) : null;
  const tally = ws ? courseTally("grok-bot", ws) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Edit user
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {person?.name ?? "User"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Changes apply to this campus record — header, certificate name, and
        staff notes.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!person) return;
          updateUser(person.id, { name, email, role, title, notes });
          setSaved(true);
        }}
      >
        <Field label="Name" id="name">
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setSaved(false);
              setName(e.target.value);
            }}
            className="h-11 rounded-xl"
          />
        </Field>
        <Field label="Email" id="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setSaved(false);
              setEmail(e.target.value);
            }}
            className="h-11 rounded-xl"
          />
        </Field>
        <Field label="Title" id="title">
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setSaved(false);
              setTitle(e.target.value);
            }}
            className="h-11 rounded-xl"
          />
        </Field>
        <label className="block text-sm">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Role
          </span>
          <select
            value={role}
            onChange={(e) => {
              setSaved(false);
              setRole(e.target.value as Role);
            }}
            className="h-11 w-full rounded-xl border border-border bg-background px-3"
          >
            <option value="student">student</option>
            <option value="admin">admin</option>
            <option value="guest">guest</option>
          </select>
        </label>
        <Field label="Staff notes" id="notes">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setSaved(false);
              setNotes(e.target.value);
            }}
            rows={4}
            className="rounded-xl"
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button className="h-11 rounded-xl px-5" type="submit" disabled={!isAdmin}>
            Save record
          </Button>
          {isAdmin && person && person.role !== "admin" ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={() => {
                impersonate(person.id);
                router.push("/dashboard");
              }}
            >
              Impersonate
            </Button>
          ) : null}
          {saved ? <span className="self-center text-sm text-pass">Saved</span> : null}
        </div>
      </form>

      {tally && ws ? (
        <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="font-display text-2xl tracking-tight">Portal snapshot</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Grok Bot {tally.passed}/{tally.total} stations
            {tally.exam ? ` · exam ${tally.exam.score}` : " · exam not taken"}
            {tally.certified ? " · certified" : ""}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {Object.keys(ws.tools).length} assessments · {ws.inbox.length} inbox
            notes
            {ws.inbox[0] ? ` · last ${formatDay(ws.inbox[0].at)}` : ""}.
          </p>
        </section>
      ) : null}
    </main>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
