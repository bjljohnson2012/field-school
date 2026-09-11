"use client";

import { signOut as authSignOut } from "next-auth/react";
import { signOutLocal } from "@/lib/portal";

/** Clear portal state and, when present, the Auth.js session. */
export function signOutPortal(redirectTo = "/login") {
  signOutLocal(redirectTo);
  void authSignOut({ redirect: false }).catch(() => {
    /* Auth.js may be unconfigured in dev */
  });
}
