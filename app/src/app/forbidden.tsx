export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl">No access</h1>
      <p className="mt-3 text-muted-foreground">
        This org is invite-only. Household and sales never mix.
      </p>
    </main>
  );
}
