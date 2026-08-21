export type Clip = {
  start: number;
  end: number;
  label: string;
  why: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
};

export type AssignmentItem = {
  id: string;
  label: string;
  hint?: string;
  required: boolean;
};

export type Module = {
  slug: string;
  station: string;
  title: string;
  kicker: string;
  durationLabel: string;
  summary: string;
  thesis: string;
  bullets: string[];
  quotes: { text: string; t: string }[];
  clips: Clip[];
  assignment: {
    title: string;
    brief: string;
    items: AssignmentItem[];
    notesPlaceholder: string;
  };
  quiz: QuizQuestion[];
};

export type ModuleProgress = {
  watched: boolean;
  assignment: Record<string, boolean>;
  notes: string;
  quizScore: number | null;
  quizPassed: boolean;
  passed: boolean;
};

export type ProgressMap = Record<string, ModuleProgress>;

export type DeskBot = {
  name: string;
  job: string;
  plugins: string[];
  voice: string;
};

export type DeskRoutine = {
  name: string;
  when: string;
  does: string;
};

export type StaffDesk = {
  operator: string;
  business: string;
  bots: DeskBot[];
  routines: DeskRoutine[];
  overnightBrief: string;
};

export type CourseRecord = {
  slug: string;
  title: string;
  tagline: string;
  kicker: string;
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  contextNotes: string;
  published: boolean;
  createdBy: string;
  passRatio: number;
  examPassRatio: number;
  modules: Module[];
  examQuestions: QuizQuestion[];
  updatedAt: string;
};

export type CourseSummary = {
  slug: string;
  title: string;
  tagline: string;
  kicker: string;
  videoId: string;
  published: boolean;
  stationCount: number;
  updatedAt: string;
};

/** The company. Courses, tools, and the product brand live here. */
export const COMPANY_NAME = "Field School";
/** The course portal — certificates and campus copy use this name. */
export const UNI_NAME = "Field School University";
/** Short label in the header and share text. */
export const UNI_SHORT = "Field School";
export const GROK_BOT_SLUG = "grok-bot";

export const VIDEO_ID = "sAoTrUijP4g";
export const VIDEO_TITLE =
  "Grok Bot vs OpenClaw and Hermes: Real Business Automation";
export const VIDEO_URL = "https://www.youtube.com/watch?v=sAoTrUijP4g";
export const PASS_RATIO = 0.75;
export const EXAM_PASS_RATIO = 0.8;
