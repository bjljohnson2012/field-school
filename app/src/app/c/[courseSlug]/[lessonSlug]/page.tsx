import type { Metadata } from "next";
import { auth } from "@/auth";
import { LessonPlayer } from "@/components/library/lesson-player";
import { lessonSpineMaster } from "@/lib/library/m10";

export const metadata: Metadata = { title: "Lesson" };

export default async function PublishedLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const query = await searchParams;
  const session = await auth().catch(() => null);
  const signedIn = Boolean(session?.user?.email);
  const initial = courseSlug === "lesson-spine" && lessonSlug === "master" ? lessonSpineMaster() : null;
  return (
    <LessonPlayer
      courseSlug={courseSlug}
      lessonSlug={lessonSlug}
      step={query.step ?? "overview"}
      signedIn={signedIn}
      initial={initial}
    />
  );
}
