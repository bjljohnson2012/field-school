import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import {
  authIsConfigured,
  hasGoogleOAuthEnv,
  hasTwitterOAuthEnv,
} from "@/lib/auth/env";
import { isStaffEmail } from "@/lib/auth/staff";

function buildProviders() {
  const providers: NonNullable<NextAuthConfig["providers"]> = [];

  if (hasGoogleOAuthEnv()) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    );
  }

  if (hasTwitterOAuthEnv()) {
    const clientId =
      process.env.AUTH_TWITTER_ID ??
      process.env.X_CLIENT_ID ??
      process.env.TWITTER_CLIENT_ID!;
    const clientSecret =
      process.env.AUTH_TWITTER_SECRET ??
      process.env.X_CLIENT_SECRET ??
      process.env.TWITTER_CLIENT_SECRET!;
    providers.push(
      Twitter({
        clientId,
        clientSecret,
      }),
    );
  }

  return providers;
}

export function buildAuthConfig(): NextAuthConfig {
  return {
    providers: buildProviders(),
    pages: {
      signIn: "/login",
    },
    callbacks: {
      signIn({ profile, user }) {
        const email = profile?.email ?? user.email;
        return isStaffEmail(email);
      },
      session({ session, token }) {
        if (session.user && token.email) {
          session.user.email = token.email;
        }
        return session;
      },
      jwt({ token, profile, user }) {
        const email = profile?.email ?? user?.email;
        if (email) token.email = email;
        return token;
      },
    },
    trustHost: true,
  };
}

/** Safe no-op config when env is incomplete (keeps imports from throwing). */
export const inactiveAuthConfig: NextAuthConfig = {
  providers: [],
};

export function resolveAuthConfig(): NextAuthConfig {
  return authIsConfigured() ? buildAuthConfig() : inactiveAuthConfig;
}
