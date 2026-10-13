"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShareLink } from "@/components/share-link";
import { useDisplayedCourse } from "@/hooks/use-displayed-course";
import { UNI_NAME } from "@/lib/brand";
import { useCourseRecord } from "@/components/course/course-catalog";

export default function CertificatePage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const router = useRouter();
  const course = useCourseRecord(courseSlug);
  const view = useDisplayedCourse(courseSlug);
  const name = view.session?.name && view.session.name !== "Guest" ? view.session.name : "Field operator";

  useEffect(() => {
    if (!view.ready || !course) return;
    if (!view.certified) {
      router.replace(`/c/${course.slug}/exam`);
    }
  }, [view.ready, view.certified, course, router]);

  if (!course || !view.ready || !view.certified) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Checking the ladder…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-border bg-card px-6 py-10 sm:px-12">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {UNI_NAME}
        </p>
        <h1 className="mt-6 text-center font-display text-4xl tracking-tight">
          Passed the ladder
        </h1>
        <p className="mt-6 text-center text-lg">{name}</p>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          {course.title}
          {view.exam ? ` · exam ${view.exam.score}/${course.examQuestions.length}` : ""}.
          A Field School training credential. Not a vendor certification.
        </p>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          Certificate requires 8/10 on the exam and every lesson done on the server.
        </p>
        <p className="mt-8 text-center font-mono text-xs text-faint">
          {new Date().toISOString().slice(0, 10)} · {course.kicker || course.slug}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <ShareLink
          path={`/c/${course.slug}/certificate`}
          label="Copy certificate link"
        />
        <Link
          href={`/c/${course.slug}/desk`}
          className="inline-flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          Export share desk
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          Campus
        </Link>
      </div>
    </main>
  );
}
