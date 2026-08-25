import type { PaidPlan, PaidPlanId } from "@/lib/billing/plans";
import { PAID_PLANS } from "@/lib/billing/plans";

export const SEAT_KINDS = [
  "free",
  "course",
  "portal_3",
  "portal_unlimited",
  "certification",
  "coach_online",
  "coach_room",
  "coach_one",
] as const;

export type SeatKind = (typeof SEAT_KINDS)[number];

export type CoachingKind = "online" | "room" | "one" | null;

export type Seat = {
  kind: SeatKind;
  label: string;
  courseCap: number | null;
  coaching: CoachingKind;
  certification: boolean;
};

const SEATS: Record<SeatKind, Seat> = {
  free: {
    kind: "free",
    label: "free beta",
    courseCap: 1,
    coaching: null,
    certification: false,
  },
  course: {
    kind: "course",
    label: "one course",
    courseCap: 1,
    coaching: null,
    certification: false,
  },
  portal_3: {
    kind: "portal_3",
    label: "up to three courses",
    courseCap: 3,
    coaching: null,
    certification: false,
  },
  portal_unlimited: {
    kind: "portal_unlimited",
    label: "unlimited portal",
    courseCap: null,
    coaching: null,
    certification: false,
  },
  certification: {
    kind: "certification",
    label: "certification",
    courseCap: null,
    coaching: null,
    certification: true,
  },
  coach_online: {
    kind: "coach_online",
    label: "online cohort",
    courseCap: null,
    coaching: "online",
    certification: false,
  },
  coach_room: {
    kind: "coach_room",
    label: "in the room",
    courseCap: null,
    coaching: "room",
    certification: false,
  },
  coach_one: {
    kind: "coach_one",
    label: "one-on-one hour",
    courseCap: null,
    coaching: "one",
    certification: false,
  },
};

const PLAN_SEAT: Record<PaidPlanId, SeatKind> = {
  "10": "portal_3",
  "50": "portal_unlimited",
  "1059": "certification",
  "100": "coach_online",
  "200": "coach_room",
  "1000": "coach_one",
};

const RANK: Record<SeatKind, number> = {
  free: 0,
  course: 1,
  portal_3: 2,
  portal_unlimited: 3,
  certification: 4,
  coach_online: 5,
  coach_room: 5,
  coach_one: 6,
};

export function getSeat(kind: SeatKind | null | undefined): Seat {
  return SEATS[kind && kind in SEATS ? kind : "free"];
}

export function seatForPlan(planId: PaidPlanId): Seat {
  return getSeat(PLAN_SEAT[planId]);
}

export function seatRank(kind: SeatKind): number {
  return RANK[kind];
}

export function shouldReplaceSeat(current: SeatKind, next: SeatKind) {
  return seatRank(next) >= seatRank(current);
}

export function isSeatKind(value: unknown): value is SeatKind {
  return typeof value === "string" && (SEAT_KINDS as readonly string[]).includes(value);
}

const PRICE_TO_PLAN = Object.fromEntries(
  Object.values(PAID_PLANS).map((plan) => [plan.stripePriceId, plan.id]),
) as Record<string, PaidPlanId>;

export function planIdFromStripePrice(priceId: string | null | undefined): PaidPlanId | null {
  if (!priceId) return null;
  return PRICE_TO_PLAN[priceId] ?? null;
}

const AMOUNT_TO_PLAN: Record<number, PaidPlanId> = {
  1000: "10",
  5000: "50",
  105900: "1059",
  10000: "100",
  20000: "200",
  100000: "1000",
};

export function planIdFromAmountTotal(amount: number | null | undefined): PaidPlanId | null {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  return AMOUNT_TO_PLAN[amount] ?? null;
}

export function portalOrigin() {
  return (
    process.env.PORTAL_PUBLIC_URL?.trim().replace(/\/$/, "") ||
    "https://portal.fieldschool.ai"
  );
}

export function successNotes(kind: SeatKind): string[] {
  const seat = getSeat(kind);
  const notes: string[] = [];
  if (seat.courseCap === null) {
    notes.push("This seat includes unlimited access to the training portal.");
  } else if (seat.courseCap === 3) {
    notes.push("This seat keeps up to three courses open.");
  }
  if (seat.coaching === "online") {
    notes.push(
      "Watch for a second email soon with the link to join the weekly online cohort.",
    );
  }
  if (seat.coaching === "room") {
    notes.push(
      "The room is in Dayton, Ohio and the towns around it. If you live farther away, you cover your own travel and stay.",
    );
    notes.push("Watch for a second email soon with the time and place.");
  }
  if (seat.coaching === "one") {
    notes.push("Watch for a second email soon to set the weekly hour with Ben.");
  }
  return notes;
}

export function confirmationCopy(input: {
  plan: PaidPlan;
  email: string;
  claimUrl?: string | null;
}) {
  const seat = seatForPlan(input.plan.id);
  const login = "https://portal.fieldschool.ai/login";
  const lines = [
    `You paid for ${input.plan.name}. That is your Field School seat now.`,
    "",
    `Log in with this email: ${input.email}`,
    ...successNotes(seat.kind),
  ];

  if (input.claimUrl) {
    lines.push("", "Set your password here:", input.claimUrl);
  } else {
    lines.push("", `Sign in: ${login}`);
  }

  lines.push("", "Field School", "https://fieldschool.ai");

  return {
    subject: `You're in: ${input.plan.name}`,
    text: lines.join("\n"),
  };
}
