import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {interpolate, useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {HOOK_FULL, HOOK_PIP_COL, INSET, displayFace, gold, paper} from "./tokens";

type HookPlateProps = {
  text: string;
  local: number;
  second?: boolean;
  pip?: boolean;
};

export const HookPlate: React.FC<HookPlateProps> = ({text, local, second = false, pip = false}) => {
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("hook-fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [continueRender, handle]);
  const width = pip ? HOOK_PIP_COL : HOOK_FULL;
  const cap = second ? 92 : 108;
  const fontSize = useMemo(() => {
    if (!ready) {
      return cap;
    }
    try {
      const fitted = fitText({
        text,
        withinWidth: width - 24,
        fontFamily: displayFace,
        fontWeight: "700",
      });
      return Math.min(cap, fitted.fontSize);
    } catch {
      return cap;
    }
  }, [cap, ready, text, width]);
  const enter = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (!ready) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: INSET,
        top: second ? 430 : 240,
        width,
        overflow: "hidden",
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize,
        lineHeight: 0.95,
        letterSpacing: "0",
        color: second ? gold : paper,
        opacity: enter,
        translate: `0px ${(1 - enter) * 36}px`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
