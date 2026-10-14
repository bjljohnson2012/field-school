import type { Metadata } from "next";
import { BlockEditor } from "@/components/library/block-editor";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "New lesson" };

export default function NewLessonPage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">New lesson</h1>
      <BlockEditor lessonId="new" />
    </LibraryWorkspace>
  );
}
