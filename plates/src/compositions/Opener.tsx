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
import type { openerSchema } from "../catalog";

export const Opener: React.FC<z.infer<typeof openerSchema>> = ({
  kicker,
  title,
  subtitle,
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
                opacity: interpolate(frame, [0, 16], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              <Kicker>{kicker}</Kicker>
              <Title>{title}</Title>
              <Rule />
              <Body>{subtitle}</Body>
            </div>
          </Screen>
        </Layer>
        <Layer name="talking-head card" />
        <Layer name="lower third">
          <LowerThird label="Field School" />
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
