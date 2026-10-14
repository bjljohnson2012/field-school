import Link from "next/link";
import { DiscoverButton } from "@/components/m9/discover-button";
import { HomeCourseCta } from "@/components/profile/home-course-cta";
import { STARTER_LESSON } from "@/lib/onboarding/graph";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ starter?: string }>;
}) {
  const params = await searchParams;
  const starter = params.starter === STARTER_LESSON.courseSlug;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10" data-home="m9">
      <h1 className="font-display text-4xl tracking-tight">What is next</h1>
      <HomeCourseCta />
      {starter ? (
        <p className="mt-4 text-sm">
          <Link href={STARTER_LESSON.href} data-starter-lesson={STARTER_LESSON.courseSlug}>
            {STARTER_LESSON.label}
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No next step in this brain yet.</p>
      )}
      <div className="mt-6">
        <DiscoverButton href="/learn">Continue</DiscoverButton>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/insights">Insights</Link> keeps the longer report.
      </p>
    </main>
  );
}
