import type { Metadata } from "next";
import { BlockEditor } from "@/components/library/block-editor";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "Edit lesson" };

export default async function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Edit lesson</h1>
      <BlockEditor lessonId={lessonId} />
    </LibraryWorkspace>
  );
}
