import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LibraryWorkspace } from "@/components/library/workspace";
import { brainPages } from "@/lib/library/m10";

export const metadata: Metadata = { title: "Brain page" };

export default async function BrainPageView({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const page = brainPages().find((item) => item.id === pageId);
  if (!page) notFound();
  return (
    <LibraryWorkspace>
      <article data-brain-page={page.id}>
        <h1 className="m10-title">{page.title}</h1>
        <p className="m10-quiet-copy">{page.body}</p>
      </article>
    </LibraryWorkspace>
  );
}
