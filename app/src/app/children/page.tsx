import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChildrenDatabase } from "@/components/children-database";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?next=/children");

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <p className="eyebrow">Household</p>
      <h1 className="h-page mt-2">Children</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent-facing children/subusers database. Say child, not student. Kids have no own login. You record welcome, Field Pattern, notes, lock, a curriculum path, a next portion, and a progress ledger.
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
