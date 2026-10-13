"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  activateMemberFromAuth,
  activateStaffFromOAuth,
} from "@/lib/auth/portal-bridge";
import { importServerProgress } from "@/lib/campus-runtime/client";
import { isStaffSession } from "@/lib/members/policy";
import { importableCourseSnapshot } from "@/lib/portal";

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
    const snapshot = importableCourseSnapshot("grok-bot");
    if (snapshot) {
      void importServerProgress("grok-bot", snapshot);
    }
  }, [status, session]);

  return null;
}
