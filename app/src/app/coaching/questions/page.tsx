import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authorFromIdentity } from "@/app/api/coaching/questions/session";
import { listQuestions } from "@/app/api/coaching/questions/persist";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { QuestionsEditor } from "./questions-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Questions" };

export default async function QuestionsPage() {
  const auth = await identityFromRequest();
  if (!auth.ok) redirect("/login?next=/coaching/questions");

  const loaded = await authorFromIdentity(auth.identity);
  if (!loaded.ok) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="h-page">Questions</h1>
        <section className="card mt-6 p-6">
          <p>Question authoring is limited to platform admins and leaders.</p>
        </section>
      </main>
    );
  }

  const bank = await listQuestions(loaded.actor);
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="h-page">Questions</h1>
      <p className="mt-2 text-sm text-gray-600">
        Platform questions are shared. Org questions stay in this org.
      </p>
      <QuestionsEditor initial={bank} platformAdmin={loaded.actor.platformAdmin} />
    </main>
  );
}
