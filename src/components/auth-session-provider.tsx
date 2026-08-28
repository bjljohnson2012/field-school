"use client";

import { SessionProvider } from "next-auth/react";
import { AuthPortalSync } from "@/components/auth-portal-sync";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthPortalSync />
      {children}
    </SessionProvider>
  );
}
