import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import type {Caption} from "@remotion/captions";
import {bg, gold, paper, sansFace} from "./brand";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {LowerThird} from "./components/boxes/LowerThird";
import {TalkingHead} from "./components/head/TalkingHead";
import {Bed} from "./components/layers/Bed";
import {LessonAudio} from "./components/layers/LessonAudio";
import {Letterbox} from "./components/layers/Letterbox";
import {Stack} from "./components/layers/Stack";
import {SpineCard} from "./components/spine/SpineCard";
import {CollageBeat} from "./components/vox/CollageBeat";
import captionsJson from "./lesson/captions.json";
import episodeJson from "./lesson/episode.json";
import type {Episode} from "./schema/episode";
import {lumaVeil} from "./sceneMotionMath";

const captions = captionsJson as Caption[];
const episode = episodeJson as Episode;

export const LessonFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const sec = frame / fps;
  const found = episode.chapters.findIndex((item) => sec >= item.inSec && sec < item.outSec);
  const index = found === -1 ? episode.chapters.length - 1 : found;
  const chapter = episode.chapters[index];
  const previous = index > 0 ? episode.chapters[index - 1] : undefined;
  const voFrame = Math.round(episode.voOffsetSec * fps);
  const veil = lumaVeil(sec, chapter.inSec, chapter.outSec, 0.5, chapter.motion);

  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Stack
        bed={<Bed />}
        broll={
          <>
            <SpineCard
              chapter={chapter}
              course={episode.course}
              moduleName={episode.module}
              title={episode.title}
            />
            {veil > 0 ? (
              <AbsoluteFill style={{backgroundColor: bg, opacity: veil * 0.28}} />
            ) : null}
          </>
        }
        vox={<CollageBeat cues={episode.cues} />}
        head={
          <Sequence
            from={voFrame}
            durationInFrames={Math.max(1, durationInFrames - voFrame)}
            layout="none"
          >
            <TalkingHead offsetFrames={voFrame} />
          </Sequence>
        }
        lowerThird={
          <LowerThird
            name={episode.lowerThird.name}
            org={episode.lowerThird.org}
            visible={chapter.showHead}
          />
        }
        karaoke={<KaraokePlate captions={captions} />}
        letterbox={
          <Letterbox
            chapter={chapter}
            previousBars={previous?.letterbox ?? 0}
            voxEnterMs={episode.voxEnterMs}
          />
        }
        audio={
          <LessonAudio
            episode={episode}
            captions={captions}
            cues={episode.cues}
            stingMs={episode.stingMs}
            whooshMs={episode.whooshMs}
          />
        }
      />
      {chapter.id === "next-up" || chapter.id === "sting-tail" ? (
        <div
          style={{
            position: "absolute",
            left: 1576,
            top: 44,
            width: 80,
            height: 4,
            backgroundColor: gold,
          }}
        />
      ) : null}
      {chapter.id === "sting-tail" ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 900,
            width: 980,
            color: paper,
            opacity: 0.7,
            fontFamily: sansFace,
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: "0.08em",
            lineHeight: 1.4,
          }}
        >
          Music: {episode.music.title} by Kevin MacLeod (incompetech.com), CC BY 4.0
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
