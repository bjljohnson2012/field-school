import { CourseFrame } from "@/components/course/course-frame";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  return <CourseFrame courseSlug={courseSlug}>{children}</CourseFrame>;
}
