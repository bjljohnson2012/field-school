import { DefaultSession } from "next-auth";
import type { SeatKind } from "@/lib/billing/seats";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "admin" | "member";
      provider?: string;
      seatKind?: SeatKind;
      seatLabel?: string;
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
    seatKind?: SeatKind;
    seatLabel?: string;
  }
}
