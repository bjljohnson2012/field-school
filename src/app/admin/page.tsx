"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePortal } from "@/hooks/use-portal";
import { resetDemo } from "@/lib/portal";

const areas = [
  {
    href: "/admin/demo",
    title: "Student demo",
    body: "Impersonate Jordan, open the Grok Bot course, and submit feedback the way a student would.",
  },
  {
    href: "/admin/users",
    title: "Users",
    body: "Edit names, emails, roles, and notes. Impersonate any student without leaving the staff seat.",
  },
  {
    href: "/admin/notifications",
    title: "Notifications",
    body: "Unread feedback and messages from the campus. This is the staff inbox.",
  },
  {
    href: "/admin/tools",
    title: "Add tools",
    body: "How to register a new assessment so it shows on /tools and saves to each portal.",
  },
  {
    href: "/admin/catalog",
    title: "Catalog",
    body: "Published courses and share paths with normal URLs.",
  },
];

export default function AdminPage() {
  const { isStaff, unreadNotices, users, ready } = usePortal();

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Admin</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every staff job lives under this nav: demo the student path, read
        feedback, edit people, and add tools. Nothing here is a scavenger hunt.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="flex flex-col rounded-xl border border-border bg-card px-5 py-5 hover:bg-secondary/40"
          >
            <h2 className="font-display text-2xl tracking-tight">{area.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {area.body}
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm">
              Open
              <ArrowRight className="size-4" />
              {area.href === "/admin/notifications" && unreadNotices > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                  {unreadNotices} new
                </span>
              ) : null}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {users.length} people on this campus · start with the student demo if
          you need to show the loop in one sitting.
        </p>
        <button
          type="button"
          className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => resetDemo()}
        >
          Reset demo data
        </button>
      </div>
    </main>
  );
}
