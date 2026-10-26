import React from "react";
import { Composition, registerRoot } from "remotion";
import { CardNote, CardProps } from "./CardNote";
import { Gallery } from "./art/Gallery";
import { CardPano, PanoProps } from "./CardPano";

const Root: React.FC = () => (
  <>
  <Composition id="CardPano" component={CardPano} width={1080} height={1350} fps={30} durationInFrames={240}
    defaultProps={{ slides: [{ kind: "stake", headline: ["예시"] }], panel: 0, handle: "@citygym_geumho", topic: "예시" } as unknown as PanoProps} />
  <Composition id="Gallery" component={Gallery} width={1960} height={1500} fps={30} durationInFrames={240} />
  <Composition
    id="Card"
    component={CardNote}
    width={1080}
    height={1350}
    fps={30}
    durationInFrames={240}
    defaultProps={{ slide: { type: "highlight", lines: ["예시"], headline: "예시 {hl|문장}" }, idx: 1, total: 7 } as unknown as CardProps}
  />
  </>
);

registerRoot(Root);
