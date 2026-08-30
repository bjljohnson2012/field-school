import React from "react";
import {useCurrentFrame} from "remotion";
import {displayFace, gold, ink} from "./tokens";

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
        color: active ? gold : ink,
        opacity: shown > 0 ? 1 : 0,
      }}
    >
      {text.slice(0, shown)}
      {caret ? (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: size * 0.68,
            marginLeft: 6,
            backgroundColor: active ? gold : ink,
            translate: "0px 6px",
          }}
        />
      ) : null}
    </span>
  );
};
