import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Library</h1>
      <p className="m10-quiet-copy">The workspace for this brain. Pick a section, or use New to add a lesson.</p>
    </LibraryWorkspace>
  );
}
