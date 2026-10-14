import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brain" };

export default function LibraryBrainPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tight">Brain</h1>
      <p className="mt-4 text-sm text-muted-foreground">Pages for this brain will collect here.</p>
    </main>
  );
}
