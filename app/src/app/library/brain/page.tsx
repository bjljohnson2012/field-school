import type { Metadata } from "next";
import Link from "next/link";
import { LibraryWorkspace } from "@/components/library/workspace";
import { brainPages } from "@/lib/library/m10";

export const metadata: Metadata = { title: "Brain" };

export default function LibraryBrainPage() {
  const pages = brainPages();
  return (
    <LibraryWorkspace>
      <h1 className="m10-title">Brain</h1>
      <p className="m10-quiet-copy">Pages for this brain. This is a list, not a graph.</p>
      <ul data-brain-list="m10">
        {pages.map((page) => (
          <li key={page.id}>
            <Link href={`/library/brain/${page.id}`}>{page.title}</Link>
          </li>
        ))}
      </ul>
    </LibraryWorkspace>
  );
}
