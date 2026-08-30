import {staticFile, type CalculateMetadataFunction} from "remotion";
import {CLIP_FRAMES, HOOK_FRAMES, MASTER_FRAMES} from "./tokens";
import {defaultMadeUp} from "./MadeUp";
import type {MadeEpisode, MadeWord} from "./schema";

const loadEpisode = async (): Promise<MadeEpisode> => {
  const episodeRes = await fetch(staticFile("episodes/everything-made-up/episode.json"));
  const episode = (await episodeRes.json()) as MadeEpisode;
  try {
    const capRes = await fetch(staticFile(episode.captions || "episodes/everything-made-up/captions.json"));
    const caps = (await capRes.json()) as {words?: MadeWord[]};
    episode.words = caps.words || [];
  } catch {
    episode.words = episode.words || [];
  }
  return episode;
};

export const calcMadeUp: CalculateMetadataFunction<MadeEpisode> = async ({props}) => {
  const episode = await loadEpisode();
  const last = episode.shots[episode.shots.length - 1];
  const duration = last ? last.fromFrame + last.durationInFrames : MASTER_FRAMES;
  return {
    props: {
      ...defaultMadeUp,
      ...props,
      ...episode,
    },
    durationInFrames: Math.max(90, duration),
  };
};

export const calcMadeUpHook: CalculateMetadataFunction<MadeEpisode> = async (args) => {
  const meta = await calcMadeUp(args);
  return {
    ...meta,
    durationInFrames: HOOK_FRAMES,
  };
};

export const calcMadeUpClip: CalculateMetadataFunction<MadeEpisode> = async (args) => {
  const meta = await calcMadeUp(args);
  return {
    ...meta,
    durationInFrames: CLIP_FRAMES,
  };
};
