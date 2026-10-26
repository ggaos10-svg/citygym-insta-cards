import React, { createContext, useContext } from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";

// Animation clock. Motion runs SPEED× faster than real time (props.speed, default 1.8),
// while scene lengths stay in real seconds so narration keeps its own pace.
export const SpeedContext = createContext(1.8);
export const useF = () => useCurrentFrame() * useContext(SpeedContext);

// Isometric drawing kit for the CityGym story cuts (true iso, light from top-left).
// World units: x runs down-right, y runs down-left, z up. U = pixels per unit.

export const U = 62;
const COS = 0.866;

export const iso = (x: number, y: number, z: number): [number, number] => [(x - y) * COS * U, (x + y) * 0.5 * U - z * U];
const pts = (p: [number, number, number][]) => p.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");

const mix = (hex: string, t: number, to = "#000000") => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

const LINE = "rgba(17,17,17,0.82)";

export type BoxSpec = { x: number; y: number; z: number; w: number; d: number; h: number; c: string; top?: string };

// One solid block: top lightest, +y face (screen-left) mid, +x face (screen-right) darkest.
export const Box: React.FC<BoxSpec> = ({ x, y, z, w, d, h, c, top }) => (
  <g strokeWidth={1.6} stroke={LINE} strokeLinejoin="round">
    <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={mix(c, 0.12)} />
    <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={mix(c, 0.3)} />
    <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top ?? mix(c, 0.12, "#ffffff")} />
  </g>
);

// painter's order: far (small x+y) first, then low z first
const sortBoxes = (b: BoxSpec[]) => [...b].sort((p, q) => p.x + p.y + p.w / 2 + p.d / 2 - (q.x + q.y + q.w / 2 + q.d / 2) || p.z - q.z);

// A group that drops into place (lift along Z, never scale).
export const Drop: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const f = useF();
  const p = spring({ frame: f - delay, fps: 30, config: { damping: 13, mass: 0.7 } });
  return (
    <g transform={`translate(0 ${(1 - p) * -90})`} opacity={interpolate(f - delay, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
      {children}
    </g>
  );
};

export const Boxes: React.FC<{ b: BoxSpec[] }> = ({ b }) => (
  <>
    {sortBoxes(b).map((s, i) => (
      <Box key={i} {...s} />
    ))}
  </>
);

// ------------------------------------------------------------------ palette

export const P = {
  floor: "#E9E1D3",
  floorTop: "#F1EADF",
  metal: "#3B3D45",
  steel: "#9AA0AA",
  yellow: "#FFE45C",
  red: "#FF3B30",
  wood: "#D8A46A",
  wall: "#DCD3C3",
  skin: "#F3CBA5",
  white: "#FFFFFF",
  blue: "#5C7CFA",
};

// ------------------------------------------------------------------ props (origin = back corner)

export const floorTiles = (x: number, y: number, w: number, d: number): BoxSpec[] => [
  { x, y, z: -0.35, w, d, h: 0.35, c: P.floor, top: P.floorTop },
];

export const FloorGrid: React.FC<{ x: number; y: number; w: number; d: number }> = ({ x, y, w, d }) => (
  <g stroke="rgba(17,17,17,0.08)" strokeWidth={1.2}>
    {Array.from({ length: w - 1 }, (_, i) => (
      <line key={`a${i}`} x1={iso(x + i + 1, y, 0)[0]} y1={iso(x + i + 1, y, 0)[1]} x2={iso(x + i + 1, y + d, 0)[0]} y2={iso(x + i + 1, y + d, 0)[1]} />
    ))}
    {Array.from({ length: d - 1 }, (_, i) => (
      <line key={`b${i}`} x1={iso(x, y + i + 1, 0)[0]} y1={iso(x, y + i + 1, 0)[1]} x2={iso(x + w, y + i + 1, 0)[0]} y2={iso(x + w, y + i + 1, 0)[1]} />
    ))}
  </g>
);

export const backWall = (x: number, y: number, w: number, d: number): BoxSpec[] => [
  { x, y, z: 0, w, d: 0.2, h: 1.8, c: P.wall },
  { x, y, z: 0, w: 0.2, d, h: 1.8, c: P.wall },
];

export const stairs = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 1.1, d: 1.7, h: 0.25, c: P.metal },
  ...[0, 1, 2, 3].map((i) => ({ x: x + 0.15, y: y + 1.35 - i * 0.36, z: 0.25 + i * 0.28, w: 0.8, d: 0.36, h: 0.12, c: P.steel })),
  { x: x + 0.05, y, z: 0.25, w: 0.12, d: 0.12, h: 1.9, c: P.metal },
  { x: x + 0.93, y, z: 0.25, w: 0.12, d: 0.12, h: 1.9, c: P.metal },
  { x: x + 0.05, y, z: 2.0, w: 1.0, d: 0.3, h: 0.25, c: P.red },
];

export const cable = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 1.4, d: 1.0, h: 0.18, c: P.metal },
  { x: x + 0.1, y: y + 0.1, z: 0.18, w: 0.16, d: 0.16, h: 2.5, c: P.metal },
  { x: x + 1.14, y: y + 0.1, z: 0.18, w: 0.16, d: 0.16, h: 2.5, c: P.metal },
  { x: x + 0.1, y: y + 0.1, z: 2.68, w: 1.2, d: 0.16, h: 0.16, c: P.metal },
  { x: x + 0.45, y: y + 0.15, z: 0.3, w: 0.5, d: 0.35, h: 1.2, c: P.steel },
  { x: x + 0.4, y: y + 0.6, z: 0.18, w: 0.6, d: 0.35, h: 0.5, c: P.red },
];

export const bench = (x: number, y: number): BoxSpec[] => [
  { x, y: y + 0.2, z: 0, w: 1.8, d: 0.45, h: 0.45, c: P.metal },
  { x: x + 0.05, y: y + 0.18, z: 0.45, w: 1.7, d: 0.5, h: 0.12, c: P.red },
  { x: x - 0.3, y: y + 0.4, z: 0.95, w: 2.4, d: 0.08, h: 0.08, c: P.steel },
  { x: x - 0.2, y: y + 0.15, z: 0.65, w: 0.12, d: 0.6, h: 0.6, c: P.metal },
  { x: x + 2.0, y: y + 0.15, z: 0.65, w: 0.12, d: 0.6, h: 0.6, c: P.metal },
];

export const looseBar = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 0.12, d: 0.6, h: 0.6, c: P.metal },
  { x: x + 0.5, y: y + 0.4, z: 0, w: 0.6, d: 0.6, h: 0.12, c: P.metal },
  { x: x + 0.2, y: y + 1.0, z: 0, w: 0.5, d: 0.5, h: 0.1, c: P.metal },
];

export const booty = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 1.7, d: 1.1, h: 0.22, c: P.yellow },
  { x: x + 0.15, y: y + 0.25, z: 0.22, w: 0.9, d: 0.6, h: 0.35, c: P.metal },
  { x: x + 0.15, y: y + 0.25, z: 0.57, w: 0.9, d: 0.6, h: 0.1, c: P.yellow },
  { x: x + 1.2, y: y + 0.15, z: 0.22, w: 0.14, d: 0.14, h: 1.3, c: P.metal },
  { x: x + 1.2, y: y + 0.8, z: 0.22, w: 0.14, d: 0.14, h: 1.3, c: P.metal },
  { x: x + 1.1, y: y + 0.1, z: 1.52, w: 0.3, d: 0.9, h: 0.14, c: P.yellow },
];

export const rack = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 0.6, d: 2.0, h: 0.7, c: P.metal },
  ...[0, 1, 2, 3].map((i) => ({ x: x + 0.12, y: y + 0.15 + i * 0.45, z: 0.7, w: 0.36, d: 0.3, h: 0.22, c: i % 2 ? P.red : P.steel })),
];

export const sauna = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 1.3, d: 1.1, h: 1.6, c: P.wood },
  { x: x + 1.3, y: y + 0.25, z: 0.2, w: 0.04, d: 0.6, h: 1.1, c: "#8A5A2B" },
];

export const desk = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 2.2, d: 0.6, h: 0.9, c: P.white },
  { x: x + 1.6, y: y + 0.6, z: 0, w: 0.6, d: 0.9, h: 0.9, c: P.white },
  { x: x - 0.02, y: y - 0.02, z: 0.9, w: 2.24, d: 0.64, h: 0.06, c: P.yellow },
];

export const board = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 0.12, d: 0.12, h: 1.0, c: P.metal },
  { x, y: y + 1.6, z: 0, w: 0.12, d: 0.12, h: 1.0, c: P.metal },
  { x: x - 0.02, y: y - 0.1, z: 1.0, w: 0.12, d: 1.92, h: 1.4, c: P.white },
];

export const building = (x: number, y: number): BoxSpec[] => [
  { x, y, z: 0, w: 3, d: 2.6, h: 4.0, c: "#CFC6B8" },
  { x: x - 0.04, y: y - 0.04, z: 2.6, w: 3.08, d: 2.68, h: 0.55, c: P.yellow },
];

// Windows drawn on the +x (right) face of a box.
export const WindowsRight: React.FC<{ x: number; y: number; d: number; z0: number; rows: number; cols: number; lit?: number }> = ({ x, y, d, z0, rows, cols, lit = -1 }) => (
  <g stroke={LINE} strokeWidth={1.2}>
    {Array.from({ length: rows * cols }, (_, k) => {
      const r = Math.floor(k / cols), c = k % cols;
      const yy = y + 0.2 + c * ((d - 0.3) / cols), zz = z0 + r * 0.75;
      return <polygon key={k} points={pts([[x, yy, zz], [x, yy + 0.45, zz], [x, yy + 0.45, zz + 0.45], [x, yy, zz + 0.45]])} fill={r === lit ? "#FFF593" : "#8FA3B8"} />;
    })}
  </g>
);

// Text painted flat on a +x face (signs) or on the ground plane.
export const RightFaceText: React.FC<{ x: number; y: number; z: number; size: number; color?: string; font: string; children: React.ReactNode }> = ({ x, y, z, size, color = "#111", font, children }) => {
  const [sx, sy] = iso(x, y, z);
  return (
    <text transform={`matrix(${COS} -0.5 0 1 ${sx} ${sy})`} fontFamily={font} fontSize={size} fill={color} textAnchor="middle">
      {children}
    </text>
  );
};

export const TopText: React.FC<{ x: number; y: number; z: number; size: number; color?: string; font: string; children: React.ReactNode }> = ({ x, y, z, size, color = "#111", font, children }) => {
  const [sx, sy] = iso(x, y, z);
  return (
    <text transform={`matrix(${COS} -0.5 ${COS} 0.5 ${sx} ${sy})`} fontFamily={font} fontSize={size} fill={color} textAnchor="middle" dominantBaseline="middle">
      {children}
    </text>
  );
};

// ------------------------------------------------------------------ character

export const Person: React.FC<{
  from: [number, number];
  to?: [number, number];
  walk?: [number, number];
  shirt?: string;
  delay?: number;
  mood?: "?" | "!" | "sweat" | "happy" | null;
}> = ({ from, to, walk = [0, 30], shirt = P.blue, delay = 0, mood = null }) => {
  const f = useF() - delay;
  const t = to ? interpolate(f, walk, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const x = from[0] + ((to ?? from)[0] - from[0]) * t;
  const y = from[1] + ((to ?? from)[1] - from[1]) * t;
  const moving = to && f > walk[0] && f < walk[1];
  const bob = moving ? Math.abs(Math.sin(f * 0.55)) * 0.08 : 0;
  const appear = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [hx, hy] = iso(x + 0.2, y + 0.2, 1.62 + bob);
  const moodT = interpolate(f, [walk[1], walk[1] + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={appear}>
      <ellipse cx={iso(x + 0.2, y + 0.2, 0)[0]} cy={iso(x + 0.2, y + 0.2, 0)[1]} rx={U * 0.38} ry={U * 0.19} fill="rgba(17,17,17,0.12)" />
      <Box x={x} y={y + 0.05} z={bob} w={0.16} d={0.14} h={0.7} c="#2E3440" />
      <Box x={x + 0.22} y={y + 0.05} z={bob} w={0.16} d={0.14} h={0.7} c="#2E3440" />
      <Box x={x - 0.04} y={y} z={0.7 + bob} w={0.46} d={0.26} h={0.62} c={shirt} />
      <circle cx={hx} cy={hy} r={U * 0.27} fill={P.skin} stroke={LINE} strokeWidth={1.6} />
      <path d={`M ${hx - U * 0.27} ${hy - 2} A ${U * 0.27} ${U * 0.27} 0 0 1 ${hx + U * 0.27} ${hy - 2} Z`} fill="#2B2B2B" />
      {mood && moodT > 0 ? (
        <g opacity={moodT} transform={`translate(${hx + U * 0.45} ${hy - U * 0.7}) scale(${0.6 + 0.4 * moodT})`}>
          {mood === "sweat" ? (
            <path d="M0 -14 C 8 0, 8 10, 0 12 C -8 10, -8 0, 0 -14 Z" fill="#7CC6FF" stroke={LINE} strokeWidth={1.5} />
          ) : (
            <>
              <circle r={26} fill="#fff" stroke={LINE} strokeWidth={2} />
              <path d="M -8 20 L -16 34 L 4 24 Z" fill="#fff" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />
              <text y={11} textAnchor="middle" fontSize={32} fontWeight={800} fill={mood === "!" ? P.red : "#111"}>
                {mood === "happy" ? "♥" : mood}
              </text>
            </>
          )}
        </g>
      ) : null}
    </g>
  );
};
