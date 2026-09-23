import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <main>
      <h1 className="font-display text-3xl tracking-tight">Roster</h1>
      <p className="mt-3 text-sm text-muted-foreground">No one is on this roster yet.</p>
    </main>
  );
}
