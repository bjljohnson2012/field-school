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
import type { recapSchema } from "../catalog";

export const RecapCard: React.FC<z.infer<typeof recapSchema>> = ({
  kicker,
  title,
  points,
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
            <Kicker>{kicker}</Kicker>
            <Title>{title}</Title>
            <Rule />
            {points.slice(0, 3).map((point, i) => (
              <div
                key={point}
                style={{
                  opacity: interpolate(frame, [12 + i * 16, 26 + i * 16], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
                  marginBottom: 16,
                }}
              >
                <Body>
                  {i + 1}. {point}
                </Body>
              </div>
            ))}
          </Screen>
        </Layer>
        <Layer name="talking-head card" />
        <Layer name="lower third">
          <LowerThird label="Recap" />
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
