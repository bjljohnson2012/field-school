import { CourseCatalog } from "@/components/course/course-catalog";
import { CourseFrame } from "@/components/course/course-frame";
import { loadCourseForRender } from "@/lib/collections/load-course";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = await loadCourseForRender(courseSlug);
  return (
    <CourseCatalog course={course}>
      <CourseFrame courseSlug={courseSlug}>{children}</CourseFrame>
    </CourseCatalog>
  );
}
