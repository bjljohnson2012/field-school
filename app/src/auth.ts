import NextAuth from "next-auth";
import type { Account, Profile, User } from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { inactiveAuthConfig, resolveAuthConfig } from "@/lib/auth/config";
import { authCanMintSessions } from "@/lib/auth/env";

type JwtArgs = Parameters<NonNullable<NonNullable<NextAuthConfig["callbacks"]>["jwt"]>>[0];

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
      async jwt(args: JwtArgs) {
        const token =
          (base.callbacks?.jwt ? await base.callbacks.jwt(args) : args.token) ??
          args.token;
        const email = typeof token.email === "string" ? token.email : "";
        if (email) {
          const { findMemberByEmail } = await import("@/lib/members/store");
          const { getSeat } = await import("@/lib/billing/seats");
          const member = await findMemberByEmail(email);
          const seat = getSeat(member?.seatKind);
          token.seatKind = seat.kind;
          token.seatLabel = seat.label;
        }
        return token;
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
          const { normalizeEmail, roleForAuth } = await import("@/lib/members/policy");
          const email = normalizeEmail(
            typeof credentials?.email === "string" ? credentials.email : "",
          );
          const password =
            typeof credentials?.password === "string" ? credentials.password : "";
          if (!email || !password) return null;

          const credentialMember = await matchMemberCredential(email, password);
          const { verifyMemberLogin } = await import("@/lib/members/store");
          const jsonMember = await verifyMemberLogin(email, password);
          return credentialSessionUser({
            email,
            role: roleForAuth("credentials", email),
            jsonMember,
            credentialMember,
          });
        },
      }),
    ],
  };
}

type CredentialIdentity = { id: string; email: string; name: string };

/**
 * JSON-store match wins the session identity.
 * A member_credentials match still signs the user in when the JSON store does not.
 * Credentials cannot mint staff admin.
 */
export function credentialSessionUser(input: {
  email: string;
  role: "admin" | "member";
  jsonMember: CredentialIdentity | null;
  credentialMember: CredentialIdentity | null;
}): {
  id: string;
  email: string;
  name: string;
  role: "member";
  provider: "credentials";
} | null {
  const role = "member" as const;
  if (input.role !== "member") return null;
  if (input.jsonMember) {
    return { ...input.jsonMember, role, provider: "credentials" };
  }
  if (input.credentialMember) {
    return { ...input.credentialMember, role, provider: "credentials" };
  }
  return null;
}

async function matchMemberCredential(
  email: string,
  password: string,
): Promise<CredentialIdentity | null> {
  try {
    const { databaseUrl, getSql } = await import("@/lib/db/client");
    if (!databaseUrl()) return null;
    const sql = getSql();
    const rows = await sql<
      { id: string; email: string; name: string; password_hash: string | null }[]
    >`
      SELECT m.id, m.email, m.name, c.password_hash
      FROM members m
      LEFT JOIN member_credentials c ON c.member_id = m.id
      WHERE lower(m.email) = ${email}
    `;
    if (!rows.length) return null;
    const { compare } = await import("bcryptjs");
    for (const row of rows) {
      const hash = row.password_hash;
      if (!hash) continue;
      try {
        if (await compare(password, hash)) {
          return { id: row.id, email: row.email, name: row.name };
        }
      } catch {
        // A malformed hash is not a match.
      }
    }
    return null;
  } catch {
    return null;
  }
}

const instance = NextAuth(
  authCanMintSessions() ? buildNodeAuthConfig() : inactiveAuthConfig,
);

export const handlers = instance.handlers;
export const auth = instance.auth;
export const signIn = instance.signIn;
export const signOut = instance.signOut;
