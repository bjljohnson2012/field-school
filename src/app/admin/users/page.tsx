"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { courseTally, impersonate, workspaceFor } from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";

export default function UsersPage() {
  const { users, user, isAdmin, impersonating, ready, isStaff } = usePortal();
  const router = useRouter();

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        People
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Users</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Impersonate to see their portal. Edit to change the name on a
        certificate, the email on the header, or the notes staff keep.
      </p>
      <ul className="mt-8 grid gap-3">
        {users.map((person) => {
          const ws = workspaceFor(person.id);
          const tally = courseTally("grok-bot", ws);
          const you = user?.id === person.id;
          return (
            <li
              key={person.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-medium">
                  {person.name}
                  {you ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {impersonating ? "viewing now" : "you"}
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {person.email || "no email"} · {person.role} · {person.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Grok Bot {tally.passed}/{tally.total} stations
                  {person.notes ? ` · ${person.notes}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/users/${person.id}`}
                  className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm"
                >
                  Edit
                </Link>
                {isAdmin && person.role !== "admin" ? (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                    onClick={() => {
                      impersonate(person.id);
                      router.push("/dashboard");
                    }}
                  >
                    Impersonate
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
