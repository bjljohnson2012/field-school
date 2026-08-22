import NextAuth from "next-auth";
import { inactiveAuthConfig, resolveAuthConfig } from "@/lib/auth/config";
import { authIsConfigured } from "@/lib/auth/env";

const instance = NextAuth(
  authIsConfigured() ? resolveAuthConfig() : inactiveAuthConfig,
);

export const handlers = instance.handlers;
export const auth = instance.auth;
export const signIn = instance.signIn;
export const signOut = instance.signOut;
