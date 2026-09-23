import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Card" };

export default function CardPage() {
  return (
    <main>
      <h1 className="font-display text-3xl tracking-tight">My Card</h1>
      <p className="mt-3 text-sm text-muted-foreground">Nothing on this card yet.</p>
      <button type="button" className="btn-primary mt-6" disabled>
        Start intake
      </button>
    </main>
  );
}
