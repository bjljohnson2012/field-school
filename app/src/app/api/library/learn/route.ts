import { lessonsForSurface, readStoredLessons } from "@/lib/library/m10";

/** Member Learn catalog. Drafts stay out. */
export function GET() {
  const lessons = lessonsForSurface(readStoredLessons(), "member", "learn").map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    courseSlug: lesson.courseSlug,
    status: lesson.status,
  }));
  return Response.json({ lessons });
}
