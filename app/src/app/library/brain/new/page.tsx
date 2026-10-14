import type { Metadata } from "next";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = { title: "New brain page" };

export default function NewBrainPage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">New brain page</h1>
      <form className="m10-page-form" data-brain-page="new">
        <label className="m10-slot-label" htmlFor="brain-title">
          Title
        </label>
        <input id="brain-title" className="m10-input" name="title" />
        <label className="m10-slot-label" htmlFor="brain-body">
          Page
        </label>
        <textarea id="brain-body" className="m10-input" name="body" rows={8} />
      </form>
    </LibraryWorkspace>
  );
}
