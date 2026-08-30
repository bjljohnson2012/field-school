import React from "react";
import {sansFace, stone} from "../../brand/tokens";

type ShowLabelProps = {
  text: string;
  solo: number;
};

export const ShowLabel: React.FC<ShowLabelProps> = ({text, solo}) => {
  if (solo <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 250,
        width: 1920,
        textAlign: "center",
        fontFamily: sansFace,
        fontSize: 14,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: stone,
        opacity: solo,
      }}
    >
      {text}
    </div>
  );
};

export const plateTitle = (showSrc: string): string => {
  const stem = showSrc.replace(/^\d+-/, "").replace(/\.png$/i, "");
  return stem
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
};
