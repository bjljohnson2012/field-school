"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getCourse } from "@/lib/course/catalog";
import type { CourseRecord } from "@/lib/course/types";

const CourseCatalogContext = createContext<CourseRecord | null>(null);

export function CourseCatalog({
  course,
  children,
}: {
  course: CourseRecord | null;
  children: ReactNode;
}) {
  return <CourseCatalogContext.Provider value={course}>{children}</CourseCatalogContext.Provider>;
}

export function useCourseRecord(slug: string): CourseRecord | undefined {
  const loaded = useContext(CourseCatalogContext);
  if (loaded && loaded.slug === slug) return loaded;
  return getCourse(slug);
}
