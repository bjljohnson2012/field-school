import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tight">Library</h1>
      <p className="mt-4 text-sm text-muted-foreground">The workspace for this brain opens here.</p>
    </main>
  );
}
