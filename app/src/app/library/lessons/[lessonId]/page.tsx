import type { Metadata } from "next";
import Link from "next/link";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "Lesson" };

export default async function LibraryLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Lesson</h1>
      <p className="m10-quiet-copy" data-lesson={lessonId}>
        Preview for this lesson. Drafts stay with leaders.
      </p>
      <p className="m10-actions">
        <Link className="m10-quiet" href={`/library/lessons/${lessonId}/edit`}>
          Edit
        </Link>
        <Link className="m10-quiet" href={`/c/library/${lessonId}`}>
          Open in Learn
        </Link>
      </p>
    </LibraryWorkspace>
  );
}
