import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <main>
      <h1 className="font-display text-3xl tracking-tight">Tasks</h1>
      <p className="mt-3 text-sm text-muted-foreground">No open tasks.</p>
    </main>
  );
}
