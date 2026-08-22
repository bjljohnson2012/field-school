import NextAuth from "next-auth";
import type { Account, Profile, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { inactiveAuthConfig, resolveAuthConfig } from "@/lib/auth/config";
import { authCanMintSessions } from "@/lib/auth/env";

function buildNodeAuthConfig() {
  const base = resolveAuthConfig();
  const edgeSignIn = base.callbacks?.signIn;
  return {
    ...base,
    callbacks: {
      ...base.callbacks,
      async signIn(args: {
        user: User;
        account?: Account | null;
        profile?: Profile;
      }) {
        const allowed = edgeSignIn ? await edgeSignIn(args) : true;
        if (!allowed) return false;
        if (args.account?.provider && args.account.provider !== "credentials") {
          const { upsertOAuthMember } = await import("@/lib/members/store");
          await upsertOAuthMember({
            email: args.profile?.email ?? args.user.email,
            name: args.user.name,
            provider: args.account.provider,
          });
        }
        return true;
      },
    },
    providers: [
      ...base.providers,
      Credentials({
        name: "Email and password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email =
            typeof credentials?.email === "string" ? credentials.email : "";
          const password =
            typeof credentials?.password === "string"
              ? credentials.password
              : "";
          if (!email || !password) return null;
          const { verifyMemberLogin } = await import("@/lib/members/store");
          const member = await verifyMemberLogin(email, password);
          if (!member) return null;
          return {
            id: member.id,
            email: member.email,
            name: member.name,
            role: "member" as const,
            provider: "credentials",
          };
        },
      }),
    ],
  };
}

const instance = NextAuth(
  authCanMintSessions() ? buildNodeAuthConfig() : inactiveAuthConfig,
);

export const handlers = instance.handlers;
export const auth = instance.auth;
export const signIn = instance.signIn;
export const signOut = instance.signOut;
