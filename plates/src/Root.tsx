import "./index.css";
import { Composition } from "remotion";
import { WIDTH, HEIGHT, FPS } from "./brand/tokens";
import {
  defaults,
  definitionSchema,
  durationFrames,
  openerSchema,
  quizBumperSchema,
  recapSchema,
  talkingHeadSchema,
} from "./catalog";
import { Opener } from "./compositions/Opener";
import { RecapCard } from "./compositions/RecapCard";
import { DefinitionBoard } from "./compositions/DefinitionBoard";
import { QuizBumper } from "./compositions/QuizBumper";
import { TalkingHeadCard } from "./compositions/TalkingHeadCard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Opener"
        component={Opener}
        durationInFrames={durationFrames.Opener}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaults.Opener}
        schema={openerSchema}
      />
      <Composition
        id="RecapCard"
        component={RecapCard}
        durationInFrames={durationFrames.RecapCard}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaults.RecapCard}
        schema={recapSchema}
      />
      <Composition
        id="DefinitionBoard"
        component={DefinitionBoard}
        durationInFrames={durationFrames.DefinitionBoard}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaults.DefinitionBoard}
        schema={definitionSchema}
      />
      <Composition
        id="QuizBumper"
        component={QuizBumper}
        durationInFrames={durationFrames.QuizBumper}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaults.QuizBumper}
        schema={quizBumperSchema}
      />
      <Composition
        id="TalkingHeadCard"
        component={TalkingHeadCard}
        durationInFrames={durationFrames.TalkingHeadCard}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaults.TalkingHeadCard}
        schema={talkingHeadSchema}
      />
    </>
  );
};
