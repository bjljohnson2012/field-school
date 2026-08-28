import React from "react";
import {Img, interpolate, staticFile} from "remotion";

type FieldGraphicProps = {
  solo: number;
};

export const FieldGraphic: React.FC<FieldGraphicProps> = ({solo}) => {
  const opacity = interpolate(solo, [0, 1], [0.045, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Img
      src={staticFile("isolated-seal.png")}
      style={{
        position: "absolute",
        left: 560,
        top: 140,
        width: 800,
        height: 800,
        objectFit: "contain",
        opacity,
      }}
    />
  );
};
