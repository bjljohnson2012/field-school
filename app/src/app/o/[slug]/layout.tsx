import { DatabaseUnavailableError } from "@/lib/db/client";
import { assertOrgPageAccess } from "@/lib/campus-runtime/access";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    await assertOrgPageAccess(slug);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-display text-3xl">Campus unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            The campus database is not reachable. Guest Grok Bot still works.
          </p>
        </main>
      );
    }
    throw error;
  }
  return children;
}
