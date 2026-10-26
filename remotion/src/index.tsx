import React from "react";
import { Composition, registerRoot } from "remotion";
import { CardNote, CardProps } from "./CardNote";

const Root: React.FC = () => (
  <Composition
    id="Card"
    component={CardNote}
    width={1080}
    height={1350}
    fps={30}
    durationInFrames={240}
    defaultProps={{ slide: { type: "highlight", lines: ["예시"], headline: "예시 {hl|문장}" }, idx: 1, total: 7 } as unknown as CardProps}
  />
);

registerRoot(Root);
