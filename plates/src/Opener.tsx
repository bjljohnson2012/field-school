import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {AudioBed, CalloutCard, ChapterChip, Claim, CompareBoard, GlossaryChip, GoldRule, Kicker, Karaoke, KeyClaim, Keyword, Letterbox, LowerThird, ObjectionCard, ObjectiveSlate, OverlayLock, HeadDock, ProgressRail, ScriptureCard, SectionTitle, Title, TransitionLuma, TypeCard} from "./layers";
import {Bed} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import {cream} from "./brand";
import type {OpenerProps} from "./types";

export const Opener: React.FC<OpenerProps> = ({kicker, title, claim, objective, durationSec, overlay, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "takeover");
  const words = title.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? title;
  const lead = words.slice(0, -1).join(" ");
  const claimWords = claim.trim().split(/\s+/);
  const claimKeyword = claimWords[claimWords.length - 1] ?? claim;
  const claimLead = claimWords.slice(0, -1).join(" ");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="takeover" sceneFrame={frame}>
            <Kicker>{kicker}</Kicker>
            <Title>
              {lead ? `${lead} ` : null}
              <Keyword>{keyword}</Keyword>
            </Title>
            <GoldRule />
            <Claim>
              {claimLead ? `${claimLead} ` : null}
              <Keyword>{claimKeyword}</Keyword>
            </Claim>
            <ObjectiveSlate objective={objective} sceneFrame={frame} from={12} />
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
        <Layer name="progress">
          <ProgressRail beat="sting" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="sting" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="sting" />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="claim">
          <KeyClaim />
        </Layer>
        <Layer name="scripture">
          <ScriptureCard />
        </Layer>
        <Layer name="compare">
          <CompareBoard />
        </Layer>
        <Layer name="section">
          <SectionTitle />
        </Layer>
        <Layer name="glossary">
          <GlossaryChip />
        </Layer>
        <Layer name="objection">
          <ObjectionCard />
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
