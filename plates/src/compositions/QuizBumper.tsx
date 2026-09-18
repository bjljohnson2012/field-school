import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { z } from "zod";
import { Layer, Stack } from "../components/Stack";
import {
  Bed,
  Body,
  Kicker,
  Letterbox,
  LowerThird,
  MarkHeader,
  Rule,
  Screen,
  Title,
} from "../components/layers";
import type { quizBumperSchema } from "../catalog";

export const QuizBumper: React.FC<z.infer<typeof quizBumperSchema>> = ({
  prompt,
  sourceUnitTitle,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <MarkHeader />
          <Screen>
            <div
              style={{
                opacity: interpolate(frame, [0, 14], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              <Kicker>Check yourself</Kicker>
              <Title>{prompt}</Title>
              <Rule />
              <Body>From {sourceUnitTitle}.</Body>
            </div>
          </Screen>
        </Layer>
        <Layer name="talking-head card" />
        <Layer name="lower third">
          <LowerThird label="Quiz" />
        </Layer>
        <Layer name="captions" />
        <Layer name="letterbox">
          <Letterbox />
        </Layer>
        <Layer name="audio" />
      </Stack>
    </AbsoluteFill>
  );
};
