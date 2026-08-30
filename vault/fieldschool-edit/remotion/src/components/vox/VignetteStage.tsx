import React from "react";
import {usePaperLife, type VignetteCue} from "../../vignettes";
import {PlaybookVignette} from "./PlaybookVignette";
import {WaitingVignette} from "./WaitingVignette";

type VignetteStageProps = {
  cues: VignetteCue[];
  originMs: number;
  solo: number;
};

export const VignetteStage: React.FC<VignetteStageProps> = ({cues, originMs, solo}) => {
  return (
    <>
      {cues.map((cue, i) => (
        <OneVignette key={`${cue.id}-${cue.fromMs}`} cue={cue} next={cues[i + 1] ?? null} originMs={originMs} solo={solo} />
      ))}
    </>
  );
};

const OneVignette: React.FC<{cue: VignetteCue; next: VignetteCue | null; originMs: number; solo: number}> = ({
  cue,
  next,
  originMs,
  solo,
}) => {
  const life = usePaperLife(cue.fromMs, cue.holdMs, originMs, next ? next.fromMs : null);
  if (cue.id === "wait") {
    return <WaitingVignette open={life.open} draw={life.draw} solo={solo} />;
  }
  return <PlaybookVignette open={life.open} write={life.write} solo={solo} />;
};
