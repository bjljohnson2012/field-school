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
