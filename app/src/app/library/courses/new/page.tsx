import type { Metadata } from "next";
import Link from "next/link";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "New course" };

export default function NewCoursePage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">New course</h1>
      <p className="m10-quiet-copy">A course holds modules and lessons. Start with the first lesson.</p>
      <Link className="m10-quiet" href="/library/lessons/new">
        Add a lesson
      </Link>
    </LibraryWorkspace>
  );
}
