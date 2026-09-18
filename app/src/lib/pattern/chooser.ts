import { getCourse } from "@/lib/course/catalog";
import { emptyProgress } from "@/lib/course/content";
import { eventsForCourse, reduceCourseProgress } from "@/lib/campus-runtime/events";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { lessonForOrg } from "@/lib/campus-runtime/lessons";
import { getLiveProfile } from "./profile";
import type { BearingDim } from "./items";

/** Station tags for chooser only. Does not rewrite the course pack. */
const STATION_DIM: Record<string, BearingDim> = {
  briefing: "drive",
  "two-computers": "structure",
  "hire-one": "drive",
  plugins: "abstraction",
  "teach-task": "duty",
  routines: "structure",
  "staff-chat": "expression",
  "ship-from-chat": "drive",
  potato: "pace",
  "business-fleet": "duty",
};

export async function chooseNext(opts: {
  identity: LearnerIdentity;
  course: string;
}) {
  const tenant = lessonForOrg(opts.identity.orgSlug);
  if (tenant) {
    const profile = await getLiveProfile(opts.identity.orgId, opts.identity.membershipId);
    return {
      next: {
        course: tenant.course,
        station: tenant.slug,
        title: tenant.title,
        href: `/o/${tenant.org}/welcome`,
        bearing: profile?.bearingPrimary ?? null,
      },
      profile: profile
        ? {
            bearing: Number(profile.bearingDeg),
            primary: profile.bearingPrimary,
            locked: profile.locked,
          }
        : null,
      wrotePack: false,
      reason: profile ? "live_profile" : "tenant_welcome",
    };
  }
  const course = getCourse(opts.course) ?? getCourse("grok-bot");
  if (!course) return { next: null, reason: "no_course", wrotePack: false };
  const profile = await getLiveProfile(opts.identity.orgId, opts.identity.membershipId);
  const rows = await eventsForCourse(opts.identity, course.slug);
  const modules = reduceCourseProgress(rows);
  const open = course.modules.filter((mod) => !(modules[mod.slug] ?? emptyProgress()).passed);
  const primary = (profile?.bearingPrimary as BearingDim | null) ?? null;
  const ranked = [...open].sort((a, b) => {
    const aMatch = primary && STATION_DIM[a.slug] === primary ? 0 : 1;
    const bMatch = primary && STATION_DIM[b.slug] === primary ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return Number(a.station) - Number(b.station);
  });
  const next = ranked[0] ?? null;
  return {
    next: next
      ? {
          course: course.slug,
          station: next.slug,
          title: next.title,
          href: `/c/${course.slug}/s/${next.slug}`,
          bearing: STATION_DIM[next.slug] ?? null,
        }
      : null,
    profile: profile
      ? {
          bearing: Number(profile.bearingDeg),
          primary: profile.bearingPrimary,
          locked: profile.locked,
        }
      : null,
    wrotePack: false,
    reason: next
      ? primary
        ? "live_profile"
        : "first_open_station"
      : "ladder_clear",
  };
}
