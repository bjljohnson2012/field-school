import React from "react";
import {AbsoluteFill} from "remotion";

type StackProps = {
  children: React.ReactNode;
};

export const Stack: React.FC<StackProps> = ({children}) => {
  return <AbsoluteFill>{children}</AbsoluteFill>;
};
