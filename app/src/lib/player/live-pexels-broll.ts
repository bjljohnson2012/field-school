/** Scene mount for a cached Pexels clip. Pure: no API key and no network. */

export type LiveBroll = {
  file: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
};

export function applyLiveBroll(mounted: Partial<LiveBroll> | null | undefined): LiveBroll | null {
  if (!mounted?.file || !mounted.photographer || !mounted.photographerUrl || !mounted.pexelsUrl) return null;
  return {
    file: mounted.file,
    photographer: mounted.photographer,
    photographerUrl: mounted.photographerUrl,
    pexelsUrl: mounted.pexelsUrl,
  };
}

export type BrollCredit =
  | {
      state: "present";
      photographer: string;
      photographerUrl: string;
      pexelsUrl: string;
      label: string;
    }
  | { state: "absent" };

/** Learner-visible credit for a live mount. Absent stays soft. Pause, seek, and rail choice do not drop it. */
export function lessonSpineBrollCredit(mounted: Partial<LiveBroll> | null | undefined): BrollCredit {
  const live = applyLiveBroll(mounted);
  if (!live) return { state: "absent" };
  return {
    state: "present",
    photographer: live.photographer,
    photographerUrl: live.photographerUrl,
    pexelsUrl: live.pexelsUrl,
    label: `${live.photographer} on Pexels`,
  };
}

export type SignedInBrollMarkers = {
  "data-broll-request": "classroom";
  "data-live-broll": "non-null" | "absent";
  "data-pexels-rail-attribution": "present" | "absent";
  "data-pexels-credit": "live" | "absent";
};

/**
 * Guest stays null so preview markers stay on the Remotion player.
 * A signed-in session on that plate requests b-roll even before a rail line is stored.
 * An html5 preference stays quiet.
 */
export function signedInRemotionMarkerRail(
  stored: "remotion" | "html5" | null,
  signedIn: boolean,
): "remotion" | null {
  if (stored === "html5") return null;
  if (stored === "remotion" || signedIn) return "remotion";
  return null;
}

/** Same credit markers as the guest rail, on the signed-in Remotion living-brain hydrate. */
export function signedInRemotionBrollMarkers(
  mounted: Partial<LiveBroll> | null | undefined,
  rail: "remotion" | "html5" | null,
): SignedInBrollMarkers | null {
  if (rail !== "remotion") return null;
  const credit = lessonSpineBrollCredit(mounted);
  if (credit.state === "present") {
    return {
      "data-broll-request": "classroom",
      "data-live-broll": "non-null",
      "data-pexels-rail-attribution": "present",
      "data-pexels-credit": "live",
    };
  }
  return {
    "data-broll-request": "classroom",
    "data-live-broll": "absent",
    "data-pexels-rail-attribution": "absent",
    "data-pexels-credit": "absent",
  };
}
