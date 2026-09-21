import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {cream, gold, ink} from "./brand";
import {AudioBed, Bed, CalloutCard, CaveatCard, ChapterChip, CheckpointCard, Claim, CompareBoard, ExampleCard, GlossaryChip, GoldRule, HeadDock, Karaoke, KeyClaim, Keyword, Kicker, Letterbox, LowerThird, ObjectionCard, ObjectiveSlate, OverlayLock, PracticeCard, ProgressRail, QuoteCard, ReflectionPrompt, ScriptureCard, SectionTitle, SourceChip, SpectrumBar, StepsCard, ThresholdCard, TimelineRail, Title, TransitionLuma, TypeCard} from "./layers";
import {Layer, Stack} from "./Stack";
import {lumaVeil} from "./sceneMotionMath";
import type {RecapProps} from "./types";

export const RecapCard: React.FC<RecapProps> = ({kicker, title, points, objective, durationSec, overlay, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps;
  const veil = lumaVeil(now, 0, durationSec, 0.5, "glide");
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
          <TypeCard motion="glide" sceneFrame={frame}>
            <Kicker>{kicker}</Kicker>
            <Title>
              {lead ? `${lead} ` : null}
              <Keyword>{keyword}</Keyword>
            </Title>
            <GoldRule />
            <ObjectiveSlate objective={objective} sceneFrame={frame} from={24} />
            {points.slice(0, 3).map((point, i) => {
              const pointWords = point.trim().split(/\s+/);
              const pointKeyword = pointWords[pointWords.length - 1] ?? point;
              const pointLead = pointWords.slice(0, -1).join(" ");
              return (
                <div
                  key={point}
                  style={{
                    opacity: interpolate(frame, [24 + i * 36, 40 + i * 36], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    marginBottom: 14,
                  }}
                >
                  <Claim color={frame >= 24 + i * 36 && frame < 60 + i * 36 ? gold : ink}>
                    {i + 1}. {pointLead ? `${pointLead} ` : null}
                    <Keyword>{pointKeyword}</Keyword>
                  </Claim>
                </div>
              );
            })}
          </TypeCard>
        </Layer>
        <Layer name="talking-head card">
          <HeadDock motion="glide" sceneFrame={frame} />
        </Layer>
        <Layer name="lower third">
          <LowerThird label="Recap" />
        </Layer>
        <Layer name="captions">
          <Karaoke captions={captions} />
        </Layer>
        <Layer name="letterbox">
          <Letterbox />
        </Layer>
        <Layer name="progress">
          <ProgressRail beat="recap" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="recap" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="recap" />
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
        <Layer name="spectrum">
          <SpectrumBar />
        </Layer>
        <Layer name="threshold">
          <ThresholdCard />
        </Layer>
        <Layer name="practice">
          <PracticeCard />
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
