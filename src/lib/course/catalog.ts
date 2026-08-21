import {
  COURSE_NAME,
  COURSE_TAGLINE,
  examQuestions,
  modules,
} from "@/lib/course/content";
import {
  EXAM_PASS_RATIO,
  GROK_BOT_SLUG,
  PASS_RATIO,
  VIDEO_ID,
  VIDEO_TITLE,
  VIDEO_URL,
  type CourseRecord,
  type CourseSummary,
} from "@/lib/course/types";

export const publishedCourses: CourseRecord[] = [
  {
    slug: GROK_BOT_SLUG,
    title: COURSE_NAME,
    tagline: COURSE_TAGLINE,
    kicker: "Grok Bot · 10 stations",
    videoId: VIDEO_ID,
    videoUrl: VIDEO_URL,
    videoTitle: VIDEO_TITLE,
    contextNotes: "",
    published: true,
    createdBy: "field-school",
    passRatio: PASS_RATIO,
    examPassRatio: EXAM_PASS_RATIO,
    modules,
    examQuestions,
    updatedAt: "2026-08-21",
  },
];

export function listPublishedCourses(): CourseSummary[] {
  return publishedCourses.map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    kicker: c.kicker,
    videoId: c.videoId,
    published: c.published,
    stationCount: c.modules.length,
    updatedAt: c.updatedAt,
  }));
}

export function getCourse(slug: string): CourseRecord | undefined {
  return publishedCourses.find((c) => c.slug === slug && c.published);
}
