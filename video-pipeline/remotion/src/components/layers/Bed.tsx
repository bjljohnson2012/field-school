import React from "react";
import {AbsoluteFill} from "remotion";
import {bg} from "../../brand";

/**
 * Flat charcoal field. The olive plate token is #6B7F4F at 100% opacity,
 * max 520 px, placed at x120 y560 — omitted here because that spot covers the pill.
 */
export const Bed: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor: bg}} />;
};
