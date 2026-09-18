"use client";

import Link from "next/link";
import { ChildrenDatabase } from "@/components/children-database";

export default function ChildrenPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Household
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Children</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent-facing children/subusers database. Say child, not student. Kids
        have no own login. You record welcome, Field Pattern, notes, and lock.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/o/household" className="underline underline-offset-2">
          Back to household
        </Link>
      </p>
      <div className="mt-8">
        <ChildrenDatabase />
      </div>
    </main>
  );
}
