import React from "react";
import {AbsoluteFill} from "remotion";
import {bg} from "../../brand";

/**
 * Flat navy field. The plate token is navy #0b1f3a at 100% opacity,
 * max 520 px, placed at x120 y560 — omitted here because that spot covers the pill.
 */
export const Bed: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor: bg}} />;
};
