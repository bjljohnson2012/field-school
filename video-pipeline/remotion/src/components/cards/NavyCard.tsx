import React from "react";
import {Img, staticFile, useVideoConfig} from "remotion";
import {displayFace, navy, paper, sansFace} from "../../brand";

/** Full-screen card. One centered idea. Lockup sits small in the corner. */
export const NavyCard: React.FC<{
  kicker: string;
  text: string;
}> = ({kicker, text}) => {
  const {width, height} = useVideoConfig();
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: navy,
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("lesson60/lockup-wide-white.svg")}
        style={{position: "absolute", top: 48, right: 56, height: 52, width: "auto"}}
      />
      <div style={{maxWidth: 1400, textAlign: "center", padding: "0 120px"}}>
        <div
          style={{
            fontFamily: sansFace,
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "0.14em",
            color: paper,
            marginBottom: 28,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: text.length > 42 ? 72 : 88,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: paper,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
