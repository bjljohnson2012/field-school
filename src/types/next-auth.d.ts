import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "admin" | "member";
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "member";
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "member";
    provider?: string;
  }
}
