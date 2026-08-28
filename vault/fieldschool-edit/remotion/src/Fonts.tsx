import React from "react";
import {staticFile} from "remotion";

export const Fonts: React.FC = () => {
  return (
    <style>
      {`
        @font-face {
          font-family: Fraunces;
          src: url(${staticFile("fonts/Fraunces-700.woff2")}) format("woff2");
          font-weight: 700;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: "Source Serif 4";
          src: url(${staticFile("fonts/SourceSerif4-400.woff2")}) format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }
        @font-face {
          font-family: "IBM Plex Sans";
          src: url(${staticFile("fonts/IBMPlexSans-400.woff2")}) format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }
      `}
    </style>
  );
};
