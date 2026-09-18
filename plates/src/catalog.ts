import { z } from "zod";
import { FPS } from "./brand/tokens";

export const COMPOSITION_IDS = [
  "Opener",
  "RecapCard",
  "DefinitionBoard",
  "QuizBumper",
  "TalkingHeadCard",
] as const;

export type CompositionId = (typeof COMPOSITION_IDS)[number];

export const durationFrames = {
  Opener: 10 * FPS,
  RecapCard: 10 * FPS,
  DefinitionBoard: 6 * FPS,
  QuizBumper: 7 * FPS,
  TalkingHeadCard: 8 * FPS,
} as const;

export const openerSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
});

export const recapSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  points: z.array(z.string()).min(1).max(3),
});

export const definitionSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const quizBumperSchema = z.object({
  prompt: z.string(),
  sourceUnitTitle: z.string(),
  sourceUnitId: z.string(),
});

export const talkingHeadSchema = z.object({
  name: z.string(),
  role: z.string(),
  line: z.string(),
  dock: z.enum(["dock-right", "dock-left"]),
});

export const defaults = {
  Opener: {
    kicker: "Household",
    title: "Welcome home",
    subtitle: "A private campus. Not Grok Bot.",
  },
  RecapCard: {
    kicker: "Recap",
    title: "What stays here",
    points: [
      "This lesson is household only",
      "Progress does not cross into sales",
      "Teacher approves every plate",
    ],
  },
  DefinitionBoard: {
    term: "Field Pattern",
    definition:
      "Our first-party bearing instrument. Not MBTI, Enneagram, Gallup, or Wiley.",
  },
  QuizBumper: {
    prompt: "Check yourself",
    sourceUnitTitle: "Welcome home",
    sourceUnitId: "00000000-0000-4000-8000-000000000001",
  },
  TalkingHeadCard: {
    name: "Teacher",
    role: "Household",
    line: "Watch the card. The face stays docked.",
    dock: "dock-right" as const,
  },
};
