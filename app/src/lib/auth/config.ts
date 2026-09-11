import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import {
  authCanMintSessions,
  hasGoogleOAuthEnv,
  hasTwitterOAuthEnv,
} from "@/lib/auth/env";
import { getSeat, isSeatKind } from "@/lib/billing/seats";
import { roleForAuth } from "@/lib/members/policy";

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
      error: "/signup",
    },
    callbacks: {
      signIn({ account, profile, user }) {
        if (account?.provider === "credentials") {
          return Boolean(user?.email);
        }
        return Boolean(user?.id || user?.email || profile?.email);
      },
      session({ session, token }) {
        if (session.user) {
          if (token.email) session.user.email = token.email;
          if (token.name) session.user.name = token.name as string;
          session.user.role = token.role === "admin" ? "admin" : "member";
          session.user.provider =
            typeof token.provider === "string" ? token.provider : undefined;
          const seat = getSeat(isSeatKind(token.seatKind) ? token.seatKind : "free");
          session.user.seatKind = seat.kind;
          session.user.seatLabel = seat.label;
        }
        return session;
      },
      jwt({ token, profile, user, account }) {
        const email = profile?.email ?? user?.email;
        if (email) token.email = email;
        if (user?.name) token.name = user.name;
        if (account?.provider) token.provider = account.provider;
        if (account || user) {
          token.role = roleForAuth(account?.provider, email ?? token.email);
        }
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
  return authCanMintSessions() ? buildAuthConfig() : inactiveAuthConfig;
}
