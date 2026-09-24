import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { listFiles } from "@/app/api/coaching/files/library";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { FilesPanel, type FileRow } from "./files-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Files" };

export default async function CoachingFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const loaded = await loadLibraryCoach();
  if (!loaded.ok) {
    if (loaded.response.status === 401) redirect("/login?next=/coaching/files");
    return (
      <main>
        <h1 className="h-page">Files</h1>
        <section className="card mt-6 p-6">
          <p>File uploads are limited to coaches.</p>
        </section>
      </main>
    );
  }

  const subjectId = subject?.trim() || "";
  let files: FileRow[] = [];
  try {
    files = await listFiles(loaded.actor.orgId, subjectId || undefined);
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Files</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {loaded.name}</p>
      {subjectId ? <p className="mt-1 text-sm text-gray-600">Subject {subjectId}</p> : null}
      <FilesPanel initial={files} subject={subjectId} />
    </main>
  );
}
