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
  TalkingHeadDock,
  Title,
} from "../components/layers";
import type { talkingHeadSchema } from "../catalog";
import { DOCK_PCT, WIDTH } from "../brand/tokens";

export const TalkingHeadCard: React.FC<z.infer<typeof talkingHeadSchema>> = ({
  name,
  role,
  line,
  dock,
}) => {
  const frame = useCurrentFrame();
  const typeWidth = WIDTH - Math.round(WIDTH * DOCK_PCT) - 280;
  const typeLeft = dock === "dock-right" ? 120 : Math.round(WIDTH * DOCK_PCT) + 160;
  return (
    <AbsoluteFill>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <MarkHeader />
          <div
            style={{
              position: "absolute",
              top: 240,
              left: typeLeft,
              width: typeWidth,
              opacity: interpolate(frame, [6, 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <Kicker>Talking head</Kicker>
            <Title>Docked, not full-bleed</Title>
            <Rule />
            <Body>{line}</Body>
          </div>
        </Layer>
        <Layer name="talking-head card">
          <TalkingHeadDock dock={dock} name={name} role={role} />
        </Layer>
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
