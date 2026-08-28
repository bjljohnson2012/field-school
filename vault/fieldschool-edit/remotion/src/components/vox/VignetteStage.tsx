import React from "react";
import {usePaper, type VignetteCue} from "../../vignettes";
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
  const open = usePaper(cue.fromMs, cue.holdMs, originMs, next ? next.fromMs : null);
  if (cue.id === "wait") {
    return <WaitingVignette open={open} solo={solo} />;
  }
  return <PlaybookVignette open={open} solo={solo} />;
};
