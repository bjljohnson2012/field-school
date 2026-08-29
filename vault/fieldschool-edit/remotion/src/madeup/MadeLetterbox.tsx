import React from "react";
import {bg, gold} from "./tokens";

type MadeLetterboxProps = {
  mode: "none" | "hair" | "vox";
};

export const MadeLetterbox: React.FC<MadeLetterboxProps> = ({mode}) => {
  if (mode === "none") {
    return null;
  }
  if (mode === "hair") {
    return (
      <>
        <div style={{position: "absolute", left: 80, top: 36, width: 1760, height: 2, backgroundColor: gold, opacity: 0.35}} />
        <div style={{position: "absolute", left: 80, bottom: 36, width: 1760, height: 2, backgroundColor: gold, opacity: 0.35}} />
      </>
    );
  }
  return (
    <>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: 48, backgroundColor: bg}} />
      <div style={{position: "absolute", left: 0, bottom: 0, width: 1920, height: 48, backgroundColor: bg}} />
    </>
  );
};

export const Letterbox = MadeLetterbox;
