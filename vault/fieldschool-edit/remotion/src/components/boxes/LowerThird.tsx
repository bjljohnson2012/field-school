import React from "react";
import {ink, sansFace, stone} from "../../brand/tokens";

type LowerThirdProps = {
  title: string;
  kicker: string;
};

export const LowerThird: React.FC<LowerThirdProps> = ({title, kicker}) => {
  return (
    <div style={{position: "absolute", left: 64, bottom: 64, minWidth: 360}}>
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: stone,
        }}
      >
        {kicker}
      </div>
      <div style={{fontFamily: sansFace, fontSize: 22, fontWeight: 400, color: ink, marginTop: 6}}>{title}</div>
    </div>
  );
};
