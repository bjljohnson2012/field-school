"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  activateMemberFromAuth,
  activateStaffFromOAuth,
} from "@/lib/auth/portal-bridge";
import { fetchProgress } from "@/lib/campus-runtime/client";
import { isStaffSession } from "@/lib/members/policy";
import { applyServerCourse } from "@/lib/portal";

/** Keep the browser portal in step with the Auth.js session. */
export function AuthPortalSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (isStaffSession(session) && session.user.email) {
      activateStaffFromOAuth(session.user.email, session.user.name);
    } else {
      activateMemberFromAuth(session.user.email, session.user.name);
    }
    void fetchProgress("grok-bot").then((data) => {
      if (data.authenticated && data.modules) {
        applyServerCourse("grok-bot", data.modules);
      }
    });
  }, [status, session]);

  return null;
}
