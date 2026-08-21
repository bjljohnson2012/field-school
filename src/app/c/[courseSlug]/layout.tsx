import { CourseSubnav } from "@/components/course-subnav";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  return (
    <>
      <CourseSubnav courseSlug={courseSlug} />
      {children}
    </>
  );
}
