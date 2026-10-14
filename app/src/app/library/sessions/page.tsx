import type { Metadata } from "next";
import { SessionRows } from "@/components/library/session-rows";
import { LibraryWorkspace } from "@/components/library/workspace";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Published next steps from Coaching.",
};

export default function LibrarySessionsPage() {
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Sessions</h1>
      <SessionRows />
    </LibraryWorkspace>
  );
}
