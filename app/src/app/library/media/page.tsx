import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "Media" };

export default function LibraryMediaPage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Media</h1>
      <p className="m10-quiet-copy">Files used by lessons in this brain.</p>
      <p data-media-empty="true">No files yet.</p>
    </LibraryWorkspace>
  );
}
