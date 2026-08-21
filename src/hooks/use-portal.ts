"use client";

import { useEffect, useState } from "react";
import {
  activeUser,
  activeWorkspace,
  continueAsGuest,
  courseTally,
  ensureCourse,
  isAdminView,
  loadPortal,
  sessionFrom,
  subscribePortal,
  unreadNoticeCount,
  type PortalState,
} from "@/lib/portal";

export function usePortal() {
  const [state, setState] = useState<PortalState | null>(null);

  useEffect(() => {
    const sync = () => setState(loadPortal());
    sync();
    return subscribePortal(sync);
  }, []);

  const workspace = state ? activeWorkspace(state) : null;
  const user = state ? activeUser(state) : null;
  const impersonator = state?.impersonatorId
    ? state.users.find((u) => u.id === state.impersonatorId) ?? null
    : null;

  return {
    ready: state !== null,
    portal: state,
    session: state ? sessionFrom(state) : null,
    user,
    users: state?.users ?? [],
    impersonator,
    impersonating: Boolean(state?.impersonatorId),
    isAdmin: Boolean(user?.role === "admin" && !state?.impersonatorId),
    isStaff: state ? isAdminView(state) : false,
    tools: workspace?.tools ?? {},
    inbox: workspace?.inbox ?? [],
    notices: state?.notices ?? [],
    unreadNotices: state ? unreadNoticeCount(state) : 0,
    feedback: state?.feedback ?? [],
    guest: () => continueAsGuest(),
  };
}

export function useCoursePortal(courseSlug: string) {
  const { ready, portal, session } = usePortal();
  const course = portal ? ensureCourse(courseSlug) : null;
  const tally = courseSlug
    ? courseTally(courseSlug)
    : { passed: 0, total: 0, exam: null, certified: false };
  return { ready, session, course, tally };
}
