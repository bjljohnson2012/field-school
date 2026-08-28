import React from "react";
import {sansFace, gold, paper, ink} from "../../brand/tokens";

type LowerThirdProps = {
  title: string;
  kicker: string;
};

export const LowerThird: React.FC<LowerThirdProps> = ({title, kicker}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 56,
        minWidth: 420,
        padding: "14px 20px",
        backgroundColor: paper,
        borderTop: `3px solid ${gold}`,
      }}
    >
      <div style={{fontFamily: sansFace, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: gold}}>
        {kicker}
      </div>
      <div style={{fontFamily: sansFace, fontSize: 22, fontWeight: 400, color: ink, marginTop: 4}}>{title}</div>
    </div>
  );
};
