import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { listPendingReviews, reviewQuestions, subjectChoices } from "@/app/api/coaching/reviews/load";
import { ReviewsPanel, type ReviewQuestion, type ReviewRow, type SubjectChoice } from "./reviews-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const loaded = await loadTaskActor();
  if (!loaded.ok) {
    if (loaded.status === 401) redirect("/login?next=/coaching/reviews");
    return (
      <main>
        <h1 className="h-page">Reviews</h1>
        <section className="card mt-6 p-6">
          <p>No pending reviews.</p>
        </section>
      </main>
    );
  }

  let reviews: ReviewRow[] = [];
  let questions: ReviewQuestion[] = [];
  let subjects: SubjectChoice[] = [];
  try {
    reviews = await listPendingReviews(loaded.world, loaded.actor, subject?.trim() || undefined);
    questions = await reviewQuestions(loaded.actor.orgId);
    subjects = await subjectChoices(loaded.world, loaded.actor);
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Reviews</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pending monthly reviews for this org.</p>
      <ReviewsPanel
        initialReviews={reviews}
        questions={questions}
        subjects={subjects}
        actorMembershipId={loaded.actor.membershipId}
      />
    </main>
  );
}
