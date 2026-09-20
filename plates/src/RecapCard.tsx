import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {cream, gold, ink} from "./brand";
import {AudioBed, Bed, Claim, GoldRule, HeadDock, Karaoke, Keyword, Kicker, Letterbox, LowerThird, ObjectiveSlate, OverlayLock, Title, TypeCard} from "./layers";
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
        <Layer name="audio">
          <AudioBed />
        </Layer>
      </Stack>
      {veil > 0 ? <AbsoluteFill style={{backgroundColor: cream, opacity: veil}} /> : null}
      <OverlayLock overlay={overlay} />
    </AbsoluteFill>
  );
};
