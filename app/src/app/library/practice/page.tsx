import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "Practice" };

export default function LibraryPracticePage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Practice</h1>
      <p className="m10-quiet-copy">Practice items live on the lesson. Pass at 75%.</p>
    </LibraryWorkspace>
  );
}
