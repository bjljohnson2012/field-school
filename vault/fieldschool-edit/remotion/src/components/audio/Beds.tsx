import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {bedFile, bedVolume, hitFile, hitVolume, stingFile, stingVolume, tickFile, tickVolume, whooshFile, whooshVolume} from "../../brand/audio";

const BED_FRAMES = 1834;

type BedsProps = {
  durationInFrames: number;
  volume?: number;
};

export const Beds: React.FC<BedsProps> = ({durationInFrames, volume = bedVolume}) => {
  const loops = Math.ceil((durationInFrames + 60) / BED_FRAMES);
  return (
    <>
      {Array.from({length: loops}, (_, i) => (
        <Sequence key={`bed-${i}`} from={i * BED_FRAMES} durationInFrames={BED_FRAMES} layout="none">
          <Audio src={staticFile(bedFile)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
};

export const StingHit: React.FC<{from: number}> = ({from}) => {
  return (
    <Sequence from={from} durationInFrames={20} layout="none">
      <Audio src={staticFile(stingFile)} volume={stingVolume} />
    </Sequence>
  );
};

export const TickHit: React.FC<{from: number}> = ({from}) => {
  return (
    <Sequence from={from} durationInFrames={10} layout="none">
      <Audio src={staticFile(tickFile)} volume={tickVolume} />
    </Sequence>
  );
};

export const WhooshHit: React.FC<{from: number}> = ({from}) => {
  return (
    <Sequence from={from} durationInFrames={14} layout="none">
      <Audio src={staticFile(whooshFile)} volume={whooshVolume} />
    </Sequence>
  );
};

export const NumberHit: React.FC<{from: number}> = ({from}) => {
  return (
    <Sequence from={from} durationInFrames={12} layout="none">
      <Audio src={staticFile(hitFile)} volume={hitVolume} />
    </Sequence>
  );
};
