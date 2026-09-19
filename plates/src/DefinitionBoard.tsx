import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {cream} from "./brand";
import {Bed, Claim, GoldRule, HeadDock, Karaoke, Kicker, Letterbox, LowerThird, OverlayLock, Title, TypeCard} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import type {DefinitionProps} from "./types";

export const DefinitionBoard: React.FC<DefinitionProps> = ({
  term,
  definition,
  durationSec,
  overlay,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "glide");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="glide" sceneFrame={24}>
            <Kicker>Definition</Kicker>
            <Title>{term}</Title>
            <GoldRule />
            <Claim>{definition}</Claim>
          </TypeCard>
        </Layer>
        <Layer name="talking-head card">
          <HeadDock motion="glide" sceneFrame={frame} />
        </Layer>
        <Layer name="lower third">
          <LowerThird label="Definition" />
        </Layer>
        <Layer name="captions">
          <Karaoke captions={captions} />
        </Layer>
        <Layer name="letterbox">
          <Letterbox />
        </Layer>
        <Layer name="audio" />
      </Stack>
      {veil > 0 ? <AbsoluteFill style={{backgroundColor: cream, opacity: veil}} /> : null}
      <OverlayLock overlay={overlay} />
    </AbsoluteFill>
  );
};
