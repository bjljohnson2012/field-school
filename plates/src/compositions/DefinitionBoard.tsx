import { AbsoluteFill } from "remotion";
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
import type { definitionSchema } from "../catalog";

export const DefinitionBoard: React.FC<z.infer<typeof definitionSchema>> = ({
  term,
  definition,
}) => {
  return (
    <AbsoluteFill>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen">
          <MarkHeader />
          <Screen>
            <Kicker>Definition</Kicker>
            <Title>{term}</Title>
            <Rule />
            <Body>{definition}</Body>
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
