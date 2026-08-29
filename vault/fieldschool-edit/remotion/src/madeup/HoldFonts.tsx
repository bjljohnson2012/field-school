import React, {useEffect, useState} from "react";
import {useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";

export const HoldFonts: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("made-fonts"));
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [continueRender, handle]);
  return <>{children}</>;
};
