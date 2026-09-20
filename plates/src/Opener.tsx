import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioBed, Claim, GoldRule, Kicker, Karaoke, Letterbox, LowerThird, OverlayLock, HeadDock, Title, TypeCard} from "./layers";
import {Bed} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import {cream} from "./brand";
import type {OpenerProps} from "./types";

export const Opener: React.FC<OpenerProps> = ({kicker, title, claim, durationSec, overlay, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "takeover");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="takeover" sceneFrame={frame}>
            <Kicker>{kicker}</Kicker>
            <Title>{title}</Title>
            <GoldRule />
            <Claim>{claim}</Claim>
          </TypeCard>
        </Layer>
        <Layer name="talking-head card">
          <HeadDock motion="takeover" sceneFrame={frame} />
        </Layer>
        <Layer name="lower third">
          <LowerThird label="Opener" />
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
