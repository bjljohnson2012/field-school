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
