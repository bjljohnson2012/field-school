"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  activateMemberFromAuth,
  activateStaffFromOAuth,
} from "@/lib/auth/portal-bridge";
import { isStaffSession } from "@/lib/members/policy";

/** Keep the browser portal in step with the Auth.js session. */
export function AuthPortalSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (isStaffSession(session) && session.user.email) {
      activateStaffFromOAuth(session.user.email, session.user.name);
      return;
    }
    activateMemberFromAuth(session.user.email, session.user.name);
  }, [status, session]);

  return null;
}
