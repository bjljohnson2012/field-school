import NextAuth from "next-auth";
import { inactiveAuthConfig, resolveAuthConfig } from "@/lib/auth/config";
import { authCanMintSessions } from "@/lib/auth/env";

/**
 * Edge-safe Auth.js instance for the /admin proxy.
 * Must stay free of Node-only providers (credentials + filesystem).
 */
const instance = NextAuth(
  authCanMintSessions() ? resolveAuthConfig() : inactiveAuthConfig,
);

export const edgeAuth = instance.auth;
