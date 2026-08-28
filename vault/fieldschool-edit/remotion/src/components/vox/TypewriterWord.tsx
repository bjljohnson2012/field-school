import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue, displayFace, ink} from "../../brand/tokens";

type TypewriterWordProps = {
  text: string;
  shown: number;
  size: number;
  active: boolean;
};

export const TypewriterWord: React.FC<TypewriterWordProps> = ({text, shown, size, active}) => {
  const frame = useCurrentFrame();
  const typing = shown > 0 && shown < text.length;
  const blink = frame % 20 < 12;
  const caret = typing ? blink : shown >= text.length && blink && frame % 40 < 8;
  const fade = interpolate(shown, [0, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <span
      style={{
        display: "block",
        marginTop: 8,
        marginBottom: 8,
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.04em",
        lineHeight: 1.05,
        color: active ? blue : ink,
        opacity: fade,
      }}
    >
      {text.slice(0, shown)}
      {caret ? (
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: size * 0.7,
            marginLeft: 6,
            backgroundColor: active ? blue : ink,
            transform: "translateY(6px)",
          }}
        />
      ) : null}
    </span>
  );
};
