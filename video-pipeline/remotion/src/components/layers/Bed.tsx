import React from "react";
import {AbsoluteFill} from "remotion";
import {bg} from "../../brand";

/** Flat deep-navy field. Cards paint the same token full screen. */
export const Bed: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor: bg}} />;
};
