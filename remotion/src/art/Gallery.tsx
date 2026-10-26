import React from "react";
import { AbsoluteFill } from "remotion";
import { Mascot, CODE_PROPS, Pose } from "./Art";

// Every code-drawn picture on one sheet, for reviewing the art: `npx remotion still src/index.tsx Gallery`.
const POSES: Pose[] = ["wave", "point", "wow", "thumbs", "worried", "cheer"];

export const Gallery: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4EFE6", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", padding: 30, gap: 24 }}>
    {POSES.map((p) => <div key={p} style={{ width: 290, height: 330 }}><Mascot pose={p} /></div>)}
    {Object.entries(CODE_PROPS).map(([name, Art]) => (
      <div key={name} style={{ width: 290, height: 330, position: "relative" }}>
        <div style={{ height: 300 }}><Art /></div>
        <div style={{ textAlign: "center", fontFamily: "Consolas, monospace", fontSize: 22, color: "#8C857B" }}>{name}</div>
      </div>
    ))}
  </AbsoluteFill>
);
