import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        That path is not on campus
      </h1>
      <p className="mt-4 text-muted-foreground">
        Share links now look like /share/desk or /c/grok-bot — not a hash and
        not an old image card.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
      >
        Back to Field School
      </Link>
    </main>
  );
}
