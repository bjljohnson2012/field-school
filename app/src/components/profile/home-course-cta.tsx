"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = { from?: string; title?: string; href?: string; courseSlug?: string };

/** First course after the wizard. The link is an enrollment slug or the outcome catalog slug. */
export function HomeCourseCta() {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile/home-course")
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as Course;
        if (!cancelled) setCourse(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (course?.from !== "outcomes" || !course.title || !course.href) return null;
  return (
    <p className="mt-4 text-sm">
      <Link href={course.href} data-next-from="outcomes" data-course-slug={course.courseSlug || ""}>
        {course.title}
      </Link>
    </p>
  );
}
