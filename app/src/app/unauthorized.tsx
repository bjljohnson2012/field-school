import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-3 text-muted-foreground">
        This org has no public roster. Guest Grok Bot is on the operator catalog.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm text-primary-foreground"
      >
        Sign in
      </Link>
    </main>
  );
}
