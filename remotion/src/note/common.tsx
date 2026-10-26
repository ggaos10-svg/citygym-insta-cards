import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/NanumMyeongjo";
import { loadFont as loadPunch } from "@remotion/google-fonts/BlackHanSans";
import { useF } from "./iso";

// Shared by all three video styles: fonts, the scene schema, and the blog's caption devices
// ({hl|..} highlighter sweep, {red|..} emphasis).

export const { fontFamily: SERIF } = loadSerif("normal", { weights: ["400", "700", "800"], subsets: ["korean", "latin"] });
export const { fontFamily: PUNCH } = loadPunch("normal", { weights: ["400"], subsets: ["korean", "latin"] });

export const C = { paper: "#FBFAF6", ink: "#111111", marker: "#FFF593", red: "#FF0010", soft: "#6B6B6B", blue: "#3F51B5" };
export const FPS = 30;

export type PropName = "machines" | "stairs" | "booty" | "bench" | "sauna" | "desk" | "rack" | "board";
export type Base = { durationSec: number; prop?: PropName };
export type Hook = { type: "hook"; lines: string[]; reveal: string };
export type Section = { type: "section"; num: number; title: string };
export type Highlight = { type: "highlight"; lines: string[] };
export type Stat = { type: "stat"; value: string; caption: string; kicker?: string; count?: number };
export type Compare = { type: "compare"; left: string; right: string; rows: [string, string, string][] };
export type Punch = { type: "punch"; word: string; sub?: string };
export type Checklist = { type: "checklist"; title: string; items: string[] };
export type Cta = { type: "cta"; line: string; location: string };
export type SceneSpec = (Hook | Section | Highlight | Stat | Compare | Punch | Checklist | Cta) & Base;

export type VideoStyle = "iso" | "kinetic" | "flat" | "pulse-volt" | "pulse-fire" | "pulse-cobalt" | "note";

export interface SceneProps {
  scenes: SceneSpec[];
  brand?: string;
  speed?: number;
  style?: VideoStyle;
}

// ---------------------------------------------------------------- text helpers

export const useRise = (delay: number, damping = 200) => {
  const frame = useF();
  const p = spring({ frame: frame - delay, fps: FPS, config: { damping } });
  return { opacity: p, transform: `translateY(${(1 - p) * 20}px)` };
};

type Seg = { text: string; hl?: boolean; red?: boolean };
export const parse = (s: string): Seg[] => {
  const out: Seg[] = [];
  const re = /\{([a-z\- ]+)\|(.+?)\}/g;
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > pos) out.push({ text: s.slice(pos, m.index) });
    const names = m[1].split(" ");
    out.push({ text: m[2], hl: names.some((n) => n.startsWith("hl")), red: names.includes("red") });
    pos = m.index + m[0].length;
  }
  if (pos < s.length) out.push({ text: s.slice(pos) });
  return out;
};

// Signature device carried over from the blog: the highlighter sweep behind a phrase.
export const MarkerText: React.FC<{ text: string; start: number; red?: boolean }> = ({ text, start, red }) => {
  const frame = useF();
  const grow = interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <span style={{ position: "relative", display: "inline-block", color: red ? C.red : C.ink }}>
      <span style={{ position: "absolute", left: "-0.1em", right: "-0.1em", top: "0.2em", bottom: "0.02em", background: C.marker, transform: `scaleX(${grow}) skewX(-4deg)`, transformOrigin: "left center", borderRadius: "0.18em 0.32em 0.22em 0.4em" }} />
      <span style={{ position: "relative" }}>{text}</span>
    </span>
  );
};

export const Rich: React.FC<{ line: string; markerStart: number }> = ({ line, markerStart }) => (
  <>
    {parse(line).map((s, i) =>
      s.hl ? <MarkerText key={i} text={s.text} start={markerStart} red={s.red} /> : <span key={i} style={{ color: s.red ? C.red : C.ink }}>{s.text}</span>,
    )}
  </>
);

export const Line: React.FC<{ i: number; base?: number; size?: number; weight?: number; children: React.ReactNode }> = ({ i, base = 14, size = 54, weight = 800, children }) => (
  <div style={{ ...useRise(base + i * 6), fontSize: size, fontWeight: weight, lineHeight: 1.45, wordBreak: "keep-all" }}>{children}</div>
);

