import { PORTAL_KEY } from "@/lib/brand";
import {
  ADMIN_ID,
  DEAN_EMAIL,
  DEAN_NAME,
  STUDENT_B_ID,
  STUDENT_ID,
  isDeanEmail,
  resolveActiveUserId,
  seedUsers,
  type CampusUser,
  type Role,
} from "@/lib/campus";
import {
  computePassed,
  emptyProgress,
  passingScore,
} from "@/lib/course/content";
import { getCourse } from "@/lib/course/catalog";
import type {
  ModuleProgress,
  ProgressMap,
  StaffDesk,
} from "@/lib/course/types";

export type { CampusUser, Role };

export type Session = {
  mode: "guest" | "signed";
  name: string;
  email?: string;
  role: Role;
  userId: string;
};

export type ExamRecord = {
  score: number;
  passed: boolean;
  at: string;
};

export type CourseState = {
  modules: ProgressMap;
  exam: ExamRecord | null;
  desk: StaffDesk | null;
};

export type ToolResult = {
  toolSlug: string;
  completedAt: string;
  summary: string;
  scores: Record<string, number>;
  labels: Record<string, string>;
};

export type InboxItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  href?: string;
};

export type UserWorkspace = {
  courses: Record<string, CourseState>;
  tools: Record<string, ToolResult>;
  inbox: InboxItem[];
};

export type FeedbackItem = {
  id: string;
  userId: string;
  courseSlug: string;
  stationSlug?: string;
  kind: "feedback" | "message";
  body: string;
  at: string;
};

export type StaffNotice = {
  id: string;
  kind: "feedback" | "message" | "system";
  title: string;
  body: string;
  href?: string;
  at: string;
  read: boolean;
  fromUserId?: string;
  feedbackId?: string;
};

export type PortalState = {
  users: CampusUser[];
  activeUserId: string | null;
  impersonatorId: string | null;
  workspaces: Record<string, UserWorkspace>;
  feedback: FeedbackItem[];
  notices: StaffNotice[];
};

const blankDesk = (): StaffDesk => ({
  operator: "",
  business: "",
  bots: [
    { name: "", job: "", plugins: [], voice: "" },
    { name: "", job: "", plugins: [], voice: "" },
    { name: "", job: "", plugins: [], voice: "" },
  ],
  routines: [
    { name: "", when: "", does: "" },
    { name: "", when: "", does: "" },
  ],
  overnightBrief: "",
});

export function emptyCourseState(): CourseState {
  return { modules: {}, exam: null, desk: blankDesk() };
}

export function emptyWorkspace(): UserWorkspace {
  return { courses: {}, tools: {}, inbox: [] };
}

function seedNotices(): StaffNotice[] {
  return [
    {
      id: "notice-seed-jordan",
      kind: "feedback",
      title: "Feedback from Jordan Hale",
      body: "Station 01 is clear. Can we get a shorter clip list for the two-computers station?",
      href: "/admin/notifications",
      at: "2026-08-20T15:10:00.000Z",
      read: false,
      fromUserId: STUDENT_ID,
      feedbackId: "feedback-seed-jordan",
    },
  ];
}

function seedFeedback(): FeedbackItem[] {
  return [
    {
      id: "feedback-seed-jordan",
      userId: STUDENT_ID,
      courseSlug: "grok-bot",
      stationSlug: "briefing",
      kind: "feedback",
      body: "Station 01 is clear. Can we get a shorter clip list for the two-computers station?",
      at: "2026-08-20T15:10:00.000Z",
    },
  ];
}

function seedWorkspaces(): Record<string, UserWorkspace> {
  return {
    [ADMIN_ID]: {
      ...emptyWorkspace(),
      inbox: [
        {
          id: "admin-welcome",
          at: "2026-08-01T12:00:00.000Z",
          title: "Staff desk is open",
          body: "Impersonate Jordan for the student walk, then check notifications when feedback lands.",
          href: "/admin/demo",
        },
      ],
    },
    [STUDENT_ID]: {
      courses: {
        "grok-bot": {
          modules: {
            briefing: {
              watched: true,
              assignment: { list8: true },
              notes: "Need a Monday guest list from Luma by 9am.",
              quizScore: null,
              quizPassed: false,
              passed: false,
            },
          },
          exam: null,
          desk: blankDesk(),
        },
      },
      tools: {},
      inbox: [
        {
          id: "jordan-welcome",
          at: "2026-08-10T12:05:00.000Z",
          title: "Welcome, Jordan",
          body: "Your Grok Bot course is open. Watch the clip, do the field work, then send staff a note if a station is stuck.",
          href: "/c/grok-bot",
        },
      ],
    },
    [STUDENT_B_ID]: emptyWorkspace(),
  };
}

export function emptyPortal(): PortalState {
  return {
    users: seedUsers,
    activeUserId: null,
    impersonatorId: null,
    workspaces: seedWorkspaces(),
    feedback: seedFeedback(),
    notices: seedNotices(),
  };
}

function deanRecord(base?: CampusUser): CampusUser {
  return {
    id: ADMIN_ID,
    name:
      !base?.name || base.name === "Maya Chen" || base.name === "maya"
        ? DEAN_NAME
        : base.name,
    email: DEAN_EMAIL,
    role: "admin",
    title: base?.title || "Campus admin",
    notes: base?.notes || "Dean seat. Sign in with Google.",
    createdAt: base?.createdAt || new Date().toISOString(),
  };
}

export function ensureDean(state: PortalState): PortalState {
  const found =
    state.users.find((u) => isDeanEmail(u.email)) ??
    state.users.find((u) => u.id === ADMIN_ID) ??
    state.users.find((u) => u.id === "user-maya");
  const dean = deanRecord(found);
  const dropIds = new Set(
    [found?.id, ADMIN_ID, "user-maya"].filter(Boolean) as string[],
  );
  const users = [
    dean,
    ...state.users.filter(
      (u) => !dropIds.has(u.id) && !isDeanEmail(u.email),
    ),
  ];
  const workspaces = { ...state.workspaces };
  if (found && found.id !== ADMIN_ID && workspaces[found.id] && !workspaces[ADMIN_ID]) {
    workspaces[ADMIN_ID] = workspaces[found.id];
  }
  if (!workspaces[ADMIN_ID]) workspaces[ADMIN_ID] = emptyWorkspace();
  const impersonatorId =
    state.impersonatorId && dropIds.has(state.impersonatorId)
      ? ADMIN_ID
      : state.impersonatorId;
  const mappedActive =
    state.activeUserId && dropIds.has(state.activeUserId)
      ? ADMIN_ID
      : state.activeUserId;
  return {
    ...state,
    users,
    workspaces,
    impersonatorId,
    activeUserId: resolveActiveUserId(mappedActive, users),
  };
}

function read(): PortalState {
  if (typeof window === "undefined") return emptyPortal();
  try {
    const raw = localStorage.getItem(PORTAL_KEY);
    if (!raw) return emptyPortal();
    const parsed = JSON.parse(raw) as Partial<PortalState>;
    if (!parsed.users?.length) return emptyPortal();
    const users = parsed.users ?? seedUsers;
    return ensureDean({
      ...emptyPortal(),
      ...parsed,
      users,
      workspaces: parsed.workspaces ?? seedWorkspaces(),
      feedback: parsed.feedback ?? [],
      notices: parsed.notices ?? [],
      activeUserId: resolveActiveUserId(parsed.activeUserId, users),
      impersonatorId: parsed.impersonatorId ?? null,
    });
  } catch {
    return emptyPortal();
  }
}

function write(next: PortalState) {
  localStorage.setItem(PORTAL_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("fsu-portal"));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function workspaceOf(state: PortalState, userId: string): UserWorkspace {
  return state.workspaces[userId] ?? emptyWorkspace();
}

function setWorkspace(
  state: PortalState,
  userId: string,
  workspace: UserWorkspace,
): PortalState {
  return {
    ...state,
    workspaces: { ...state.workspaces, [userId]: workspace },
  };
}

function pushUserInbox(
  state: PortalState,
  userId: string,
  item: Omit<InboxItem, "id" | "at">,
): PortalState {
  const ws = workspaceOf(state, userId);
  const next: InboxItem = {
    id: newId("inbox"),
    at: new Date().toISOString(),
    ...item,
  };
  return setWorkspace(state, userId, {
    ...ws,
    inbox: [next, ...ws.inbox].slice(0, 40),
  });
}

export function loadPortal() {
  return read();
}

export function subscribePortal(cb: () => void) {
  const on = () => cb();
  window.addEventListener("fsu-portal", on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener("fsu-portal", on);
    window.removeEventListener("storage", on);
  };
}

export function getUser(state: PortalState, id: string | null) {
  if (!id) return null;
  return state.users.find((u) => u.id === id) ?? null;
}

export function activeUser(state: PortalState) {
  return getUser(state, state.activeUserId);
}

export function sessionFrom(state: PortalState): Session | null {
  const user = activeUser(state);
  if (!user) return null;
  return {
    mode: user.role === "guest" ? "guest" : "signed",
    name: user.name,
    email: user.email,
    role: user.role,
    userId: user.id,
  };
}

export function isAdminView(state: PortalState) {
  const actorId = state.impersonatorId ?? state.activeUserId;
  const actor = getUser(state, actorId);
  return actor?.role === "admin";
}

export function unreadNoticeCount(state: PortalState) {
  return state.notices.filter((n) => !n.read).length;
}

export function resetDemo() {
  const next = { ...emptyPortal(), activeUserId: ADMIN_ID };
  write(next);
  return next;
}

export function enterAs(userId: string) {
  const state = read();
  const user = getUser(state, userId);
  if (!user) return state;
  write({ ...state, activeUserId: user.id, impersonatorId: null });
  return read();
}

export function continueAsGuest() {
  const state = read();
  const existing = state.users.find((u) => u.role === "guest");
  if (existing) {
    write({ ...state, activeUserId: existing.id, impersonatorId: null });
    return read();
  }
  const guest: CampusUser = {
    id: newId("user"),
    name: "Guest",
    email: "",
    role: "guest",
    title: "Visitor",
    notes: "Browser guest.",
    createdAt: new Date().toISOString(),
  };
  let next: PortalState = {
    ...state,
    users: [...state.users, guest],
    activeUserId: guest.id,
    impersonatorId: null,
    workspaces: { ...state.workspaces, [guest.id]: emptyWorkspace() },
  };
  next = pushUserInbox(next, guest.id, {
    title: "Guest walk opened",
    body: "Progress stays on this browser. Sign in with a name anytime to label certificates.",
    href: "/dashboard",
  });
  write(next);
  return next;
}

export function signInLocal(name: string, email?: string) {
  const state = read();
  const trimmed = name.trim() || "Field operator";
  const mail = email?.trim() || "";
  const existing = mail
    ? state.users.find((u) => u.email && u.email.toLowerCase() === mail.toLowerCase())
    : null;
  if (existing) {
    write({ ...state, activeUserId: existing.id, impersonatorId: null });
    return read();
  }
  const user: CampusUser = {
    id: newId("user"),
    name: trimmed,
    email: mail,
    role: "student",
    title: "Student",
    notes: "",
    createdAt: new Date().toISOString(),
  };
  let next: PortalState = {
    ...state,
    users: [...state.users, user],
    activeUserId: user.id,
    impersonatorId: null,
    workspaces: { ...state.workspaces, [user.id]: emptyWorkspace() },
  };
  next = pushUserInbox(next, user.id, {
    title: "Portal labeled",
    body: `Certificates and assessments will show as ${trimmed}.`,
    href: "/dashboard",
  });
  write(next);
  return next;
}

export function signInWithGoogleAccount(input: {
  email: string;
  name?: string;
}) {
  let state = ensureDean(read());
  const mail = input.email.trim().toLowerCase();
  if (!mail) return state;
  const dean = isDeanEmail(mail);
  let user = state.users.find((u) => u.email.trim().toLowerCase() === mail);
  if (!user) {
    user = {
      id: dean ? ADMIN_ID : newId("user"),
      name:
        input.name?.trim() ||
        (dean ? DEAN_NAME : mail.split("@")[0] || "Student"),
      email: mail,
      role: dean ? "admin" : "student",
      title: dean ? "Campus admin" : "Student",
      notes: dean ? "Signed in with Google." : "",
      createdAt: new Date().toISOString(),
    };
    state = {
      ...state,
      users: dean
        ? [user, ...state.users.filter((u) => u.id !== ADMIN_ID)]
        : [...state.users, user],
      workspaces: {
        ...state.workspaces,
        [user.id]: state.workspaces[user.id] ?? emptyWorkspace(),
      },
    };
  } else if (dean && user.role !== "admin") {
    const id = user.id;
    state = {
      ...state,
      users: state.users.map((u) =>
        u.id === id ? { ...u, role: "admin", name: input.name?.trim() || u.name } : u,
      ),
    };
  }
  write({ ...state, activeUserId: user.id, impersonatorId: null });
  return read();
}

export function signOutLocal(redirectTo = "/login") {
  const state = read();
  write({ ...state, activeUserId: null, impersonatorId: null });
  if (typeof window !== "undefined" && redirectTo) {
    window.location.assign(redirectTo);
  }
}

export function impersonate(userId: string) {
  const state = read();
  const adminId = state.impersonatorId ?? state.activeUserId;
  const admin = getUser(state, adminId);
  const target = getUser(state, userId);
  if (admin?.role !== "admin" || !target || target.id === admin.id) return state;
  write({
    ...state,
    impersonatorId: admin.id,
    activeUserId: target.id,
  });
  return read();
}

export function stopImpersonating() {
  const state = read();
  if (!state.impersonatorId) return state;
  write({
    ...state,
    activeUserId: state.impersonatorId,
    impersonatorId: null,
  });
  return read();
}

export function updateUser(
  userId: string,
  patch: Partial<Pick<CampusUser, "name" | "email" | "role" | "title" | "notes">>,
) {
  const state = read();
  const actorId = state.impersonatorId ?? state.activeUserId;
  const actor = getUser(state, actorId);
  if (actor?.role !== "admin") return state;
  write({
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  });
  return read();
}

export function activeWorkspace(state = read()): UserWorkspace {
  const id = state.activeUserId;
  if (!id) return emptyWorkspace();
  return workspaceOf(state, id);
}

export function ensureCourse(slug: string): CourseState {
  const ws = activeWorkspace();
  return ws.courses[slug] ?? emptyCourseState();
}

function patchActiveCourse(slug: string, fn: (c: CourseState) => CourseState) {
  const state = read();
  const userId = state.activeUserId;
  if (!userId) return emptyCourseState();
  const ws = workspaceOf(state, userId);
  const current = ws.courses[slug] ?? emptyCourseState();
  const nextCourse = fn(current);
  write(
    setWorkspace(state, userId, {
      ...ws,
      courses: { ...ws.courses, [slug]: nextCourse },
    }),
  );
  return nextCourse;
}

export function upsertModule(
  courseSlug: string,
  moduleSlug: string,
  patch: Partial<ModuleProgress>,
) {
  return patchActiveCourse(courseSlug, (course) => {
    const cur = course.modules[moduleSlug] ?? emptyProgress();
    const nextMod: ModuleProgress = { ...cur, ...patch };
    const courseRecord = getCourse(courseSlug);
    const mod = courseRecord?.modules.find((m) => m.slug === moduleSlug);
    if (mod) nextMod.passed = computePassed(mod, nextMod);
    return {
      ...course,
      modules: { ...course.modules, [moduleSlug]: nextMod },
    };
  });
}

export function saveQuizAnswers(
  courseSlug: string,
  moduleSlug: string,
  answers: Record<string, number>,
) {
  const course = getCourse(courseSlug);
  const mod = course?.modules.find((m) => m.slug === moduleSlug);
  if (!course || !mod) throw new Error("Unknown station");
  let correct = 0;
  for (const q of mod.quiz) {
    if (answers[q.id] === q.answer) correct += 1;
  }
  const need = passingScore(mod.quiz.length, course.passRatio);
  return upsertModule(courseSlug, moduleSlug, {
    quizScore: correct,
    quizPassed: correct >= need,
  });
}

export function saveExamAnswers(
  courseSlug: string,
  answers: Record<string, number>,
) {
  const course = getCourse(courseSlug);
  if (!course) throw new Error("Unknown course");
  let correct = 0;
  for (const q of course.examQuestions) {
    if (answers[q.id] === q.answer) correct += 1;
  }
  const need = passingScore(course.examQuestions.length, course.examPassRatio);
  const passed = correct >= need;
  const exam: ExamRecord = {
    score: correct,
    passed,
    at: new Date().toISOString(),
  };
  const state = read();
  const userId = state.activeUserId;
  if (!userId) {
    return { score: correct, total: course.examQuestions.length, passed, need };
  }
  const ws = workspaceOf(state, userId);
  const current = ws.courses[courseSlug] ?? emptyCourseState();
  const nextCourse = { ...current, exam };
  const certified = isCertified(courseSlug, nextCourse);
  let next = setWorkspace(state, userId, {
    ...ws,
    courses: { ...ws.courses, [courseSlug]: nextCourse },
  });
  if (passed) {
    next = pushUserInbox(next, userId, {
      title: certified
        ? "Field School University certificate unlocked"
        : "Exam passed",
      body: certified
        ? `${course.title} is complete. Open the certificate.`
        : `Exam ${correct}/${course.examQuestions.length}. Finish any open stations to certify.`,
      href: certified ? `/c/${courseSlug}/certificate` : `/c/${courseSlug}`,
    });
  }
  write(next);
  return {
    score: correct,
    total: course.examQuestions.length,
    passed,
    need,
  };
}

export function saveDesk(courseSlug: string, desk: StaffDesk) {
  return patchActiveCourse(courseSlug, (c) => ({ ...c, desk }));
}

export function saveToolResult(result: ToolResult) {
  const state = read();
  const userId = state.activeUserId;
  if (!userId) return;
  const ws = workspaceOf(state, userId);
  const next = setWorkspace(state, userId, {
    ...ws,
    tools: { ...ws.tools, [result.toolSlug]: result },
  });
  write(
    pushUserInbox(next, userId, {
      title: "Assessment saved to your portal",
      body: result.summary,
      href: "/dashboard",
    }),
  );
}

export function submitCourseNote(input: {
  courseSlug: string;
  stationSlug?: string;
  kind: "feedback" | "message";
  body: string;
}) {
  const body = input.body.trim();
  if (!body) return null;
  const state = read();
  const user = activeUser(state);
  if (!user) return null;
  const course = getCourse(input.courseSlug);
  const station = course?.modules.find((m) => m.slug === input.stationSlug);
  const item: FeedbackItem = {
    id: newId("feedback"),
    userId: user.id,
    courseSlug: input.courseSlug,
    stationSlug: input.stationSlug,
    kind: input.kind,
    body,
    at: new Date().toISOString(),
  };
  const label = input.kind === "message" ? "Message" : "Feedback";
  const where = station
    ? `${course?.title ?? input.courseSlug} · station ${station.station}`
    : course?.title ?? input.courseSlug;
  const notice: StaffNotice = {
    id: newId("notice"),
    kind: input.kind,
    title: `${label} from ${user.name}`,
    body: `${where}: ${body}`,
    href: "/admin/notifications",
    at: item.at,
    read: false,
    fromUserId: user.id,
    feedbackId: item.id,
  };
  let next: PortalState = {
    ...state,
    feedback: [item, ...state.feedback],
    notices: [notice, ...state.notices],
  };
  next = pushUserInbox(next, user.id, {
    title: `${label} sent to staff`,
    body: `Staff can see this on Admin → Notifications.`,
    href: `/c/${input.courseSlug}`,
  });
  write(next);
  return item;
}

export function markNoticeRead(id: string) {
  const state = read();
  write({
    ...state,
    notices: state.notices.map((n) => (n.id === id ? { ...n, read: true } : n)),
  });
}

export function markAllNoticesRead() {
  const state = read();
  write({
    ...state,
    notices: state.notices.map((n) => ({ ...n, read: true })),
  });
}

export function isCertified(courseSlug: string, course = ensureCourse(courseSlug)) {
  const record = getCourse(courseSlug);
  if (!record || !course.exam?.passed) return false;
  return record.modules.every((m) => course.modules[m.slug]?.passed);
}

export function courseTally(courseSlug: string, workspace?: UserWorkspace) {
  const record = getCourse(courseSlug);
  const state = workspace ?? activeWorkspace();
  const course = state.courses[courseSlug] ?? emptyCourseState();
  const passed = record
    ? record.modules.filter((m) => course.modules[m.slug]?.passed).length
    : 0;
  return {
    passed,
    total: record?.modules.length ?? 0,
    exam: course.exam,
    certified: isCertified(courseSlug, course),
  };
}

export function workspaceFor(userId: string) {
  return workspaceOf(read(), userId);
}
