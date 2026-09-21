import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {cream} from "./brand";
import {AudioBed, Bed, CalloutCard, CaveatCard, ChapterChip, CheckpointCard, Claim, CompareBoard, ExampleCard, GlossaryChip, GoldRule, HeadDock, Karaoke, KeyClaim, Keyword, Kicker, Letterbox, LowerThird, ObjectionCard, OverlayLock, ProgressRail, QuoteCard, ReflectionPrompt, ScriptureCard, SectionTitle, SourceChip, StepsCard, TimelineRail, Title, TransitionLuma, TypeCard} from "./layers";
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
  const words = term.trim().split(/\s+/);
  const keyword = words[words.length - 1] ?? term;
  const lead = words.slice(0, -1).join(" ");
  const claimWords = definition.trim().split(/\s+/);
  const claimKeyword = claimWords[claimWords.length - 1] ?? definition;
  const claimLead = claimWords.slice(0, -1).join(" ");

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <TypeCard motion="glide" sceneFrame={24}>
            <Kicker>Definition</Kicker>
            <Title>
              {lead ? `${lead} ` : null}
              <Keyword>{keyword}</Keyword>
            </Title>
            <GoldRule />
            <Claim>
              {claimLead ? `${claimLead} ` : null}
              <Keyword>{claimKeyword}</Keyword>
            </Claim>
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
        <Layer name="progress">
          <ProgressRail beat="objective" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="objective" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="objective" />
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
        <Layer name="checkpoint">
          <CheckpointCard />
        </Layer>
        <Layer name="example">
          <ExampleCard />
        </Layer>
        <Layer name="quote">
          <QuoteCard />
        </Layer>
        <Layer name="steps">
          <StepsCard />
        </Layer>
        <Layer name="caveat">
          <CaveatCard />
        </Layer>
        <Layer name="reflect">
          <ReflectionPrompt />
        </Layer>
        <Layer name="timeline">
          <TimelineRail />
        </Layer>
        <Layer name="source">
          <SourceChip />
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
