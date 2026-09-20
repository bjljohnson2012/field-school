import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {cream} from "./brand";
import {AudioBed, Bed, Claim, GoldRule, HeadDock, Karaoke, Keyword, Kicker, Letterbox, LowerThird, OverlayLock, Title, TypeCard} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import type {TalkingHeadProps} from "./types";

export const TalkingHeadCard: React.FC<TalkingHeadProps> = ({
  name,
  role,
  line,
  dock,
  durationSec,
  overlay,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "takeover");
  const title = "Docked, not full-bleed";
  const words = title.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? title;
  const lead = words.slice(0, -1).join(" ");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="takeover" sceneFrame={frame}>
            <Kicker>Slate</Kicker>
            <Title>
              {lead ? `${lead} ` : null}
              <Keyword>{keyword}</Keyword>
            </Title>
            <GoldRule />
            <Claim>{line}</Claim>
          </TypeCard>
        </Layer>
        <Layer name="talking-head card">
          <HeadDock motion="takeover" sceneFrame={frame} dock={dock} />
        </Layer>
        <Layer name="lower third">
          <LowerThird name={name} role={role} />
        </Layer>
        <Layer name="captions">
          <Karaoke captions={captions} />
        </Layer>
        <Layer name="letterbox">
          <Letterbox />
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
