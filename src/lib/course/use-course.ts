import { useEffect, useState } from "react";
import { getPublishedCourse } from "./catalog";
import type { CourseRecord } from "./types";

export function usePublishedCourse(slug: string) {
  const [course, setCourse] = useState<CourseRecord | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getPublishedCourse({ data: { slug } })
      .then((c) => {
        if (!cancelled) setCourse(c);
      })
      .catch(() => {
        if (!cancelled) setCourse(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return course;
}
