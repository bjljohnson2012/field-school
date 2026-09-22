import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {cream} from "./brand";
import {AudioBed, Bed, CalloutCard, ChapterChip, Claim, GoldRule, HeadDock, Karaoke, Keyword, Kicker, Letterbox, LowerThird, OverlayLock, ProgressRail, Title, TransitionLuma, TypeCard} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import type {QuizBumperProps} from "./types";

export const QuizBumper: React.FC<QuizBumperProps> = ({
  prompt,
  sourceUnitTitle,
  sourceUnitId,
  durationSec,
  overlay,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "glide");
  const words = prompt.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? prompt;
  const lead = words.slice(0, -1).join(" ");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="glide" sceneFrame={frame}>
            <Kicker>Next up</Kicker>
            <Title>
              {lead ? `${lead} ` : null}
              <Keyword>{keyword}</Keyword>
            </Title>
            <GoldRule />
            <Claim>
              From {sourceUnitTitle}. Unit {sourceUnitId}.
            </Claim>
          </TypeCard>
        </Layer>
        <Layer name="talking-head card">
          <HeadDock motion="glide" sceneFrame={frame} />
        </Layer>
        <Layer name="lower third">
          <LowerThird label="Quiz" />
        </Layer>
        <Layer name="captions">
          <Karaoke captions={captions} />
        </Layer>
        <Layer name="letterbox">
          <Letterbox />
        </Layer>
        <Layer name="progress">
          <ProgressRail beat="next-up" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="next-up" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="next-up" />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="audio">
          <AudioBed />
        </Layer>
      </Stack>
      {veil > 0 ? <AbsoluteFill style={{backgroundColor: cream, opacity: veil}} /> : null}
      <OverlayLock overlay={overlay} />
    </AbsoluteFill>
  );
};
