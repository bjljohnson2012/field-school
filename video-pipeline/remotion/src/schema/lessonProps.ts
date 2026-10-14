import {z} from "zod";

/** Phase 2 contract. Cap writes this object. The renderer reads it. */
export const lessonPropsSchema = z.object({
  title: z.string(),
  course: z.string(),
  moduleName: z.string(),
  objective: z.string(),
  zoomCap: z.number().min(1).max(1.12),
  captions: z.boolean(),
  crossfadeFrames: z.number().int().min(12).max(18),
  musicBed: z.string(),
  musicSting: z.string(),
  bedOpen: z.number().min(0).max(0.4),
  bedDuck: z.number().min(0).max(0.2),
  fadeOutFrames: z.number().int().min(15).max(60),
  temperature: z.number().min(-1).max(1),
  lufsTarget: z.number(),
  notes: z.string(),
});

export type LessonProps = z.infer<typeof lessonPropsSchema>;

export const defaultLessonProps: LessonProps = {
  title: "Rule yourself before leading others",
  course: "Field School",
  moduleName: "Self-government",
  objective: "State the rule of self-government.",
  zoomCap: 1.12,
  captions: true,
  crossfadeFrames: 15,
  musicBed: "lesson60/upbeat-marimba.mp3",
  musicSting: "lesson60/marimba-intro-v3.mp3",
  bedOpen: 0.14,
  bedDuck: 0.045,
  fadeOutFrames: 30,
  temperature: -0.34,
  lufsTarget: -16,
  notes: "",
};
