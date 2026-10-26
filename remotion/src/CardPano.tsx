import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { Mascot, Pose } from "./art/Art";
import { PUNCH, parse } from "./note/common";
import { Pic } from "./note/note";
import { SANS } from "./note/pulse";

// "Pano" — one wide canvas (1080 x slides) cut into slides, so the carousel reads as one strip
// when swiped: an orange road runs through every slide, with trees and signs standing across the
// cuts. Each slide is rendered as a 1080-wide window onto the same canvas (panel = which window),
// so the cuts line up exactly. Rule: anything that crosses a cut is static, because while
// swiping the next slide shows its first frame. Motion stays 120px+ away from the cuts.
// Motion language (motion-art-direction, Playful): one spring (10-20% overshoot), lines rise
// out of a mask 0.08 s apart (kinetic-typography), one hero per slide, art is present from
// frame 0 (only text reveals) so a half-swiped slide never looks empty.

const W = 1080, H = 1350;
const C = { paper: "#F4EFE6", ink: "#1E1A16", red: "#F0532A", dim: "#8C857B", marker: "#FFD23F", card: "#FFFDF8", tree: "#4F9D5A" };
const ROAD_Y = 1090, BEND = 50; // the road meets every cut at ROAD_Y and bends up/down inside slides

export type PanoSlide = {
  kind: "cover" | "stake" | "station" | "recap" | "cta";
  headline: string[];
  sub?: string;
  prop?: string;
  pose?: Pose;
  station?: number;
  side?: string; // a second picture (e.g. the mascot demonstrating)
  items?: { title: string; prop: string }[];
  note?: string;
  location?: string;
};
export type PanoProps = { slides: PanoSlide[]; panel: number; handle: string; topic: string };

const roadMid = (i: number) => ROAD_Y + (i % 2 ? BEND : -BEND) / 2; // road height at slide i's centre
const pop = (f: number, at: number) => spring({ frame: f - at, fps: 30, config: { damping: 11, stiffness: 170 } });

const Line: React.FC<{ text: string; at: number; size: number }> = ({ text, at, size }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - at, fps: 30, config: { damping: 18, stiffness: 160 } });
  const sweep = interpolate(f, [at + 12, at + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ overflow: "hidden", paddingBottom: 4 }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: PUNCH, fontSize: size, lineHeight: 1.12, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap" }}>
        {parse(text).map((s, i) => s.hl
          ? <span key={i} style={{ position: "relative", padding: "0 6px" }}>
              <span style={{ position: "absolute", left: 0, right: 0, top: "14%", bottom: "4%", background: C.marker, transform: `scaleX(${sweep})`, transformOrigin: "left" }} />
              <span style={{ position: "relative" }}>{s.text}</span>
            </span>
          : <span key={i} style={{ color: s.red ? C.red : C.ink }}>{s.text}</span>)}
      </div>
    </div>
  );
};

const at = (x: number, y: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: x, top: y, width: w, height: h });
// mascot standing with its feet on y (its feet sit at 90% of the box height)
const Mochi: React.FC<{ pose: Pose; x: number; feet: number; size: number }> = ({ pose, x, feet, size }) =>
  <div style={at(x, feet - size * 1.2 * 0.9, size, size * 1.2)}><Mascot pose={pose} /></div>;

const Station: React.FC<{ n: number; y: number }> = ({ n, y }) => {
  const f = useCurrentFrame();
  const s = 1 + 0.06 * Math.sin(f / 6);
  return <div style={{ ...at(540 - 72, y - 72, 144, 144), borderRadius: 72, background: C.ink, border: `8px solid ${C.card}`, boxShadow: `0 0 0 6px ${C.ink}`, color: C.card, fontFamily: PUNCH, fontSize: 84, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>{n}</div>;
};

// one slide's own content, in slide-local coordinates
const Slide: React.FC<{ s: PanoSlide; i: number; n: number; handle: string; topic: string }> = ({ s, i, n, handle, topic }) => {
  const f = useCurrentFrame();
  const longest = Math.max(...s.headline.map((l) => parse(l).map((p) => p.text).join("").length));
  const size = Math.min(116, Math.floor(880 / longest));
  const subOn = interpolate(f, [20, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const road = roadMid(i);
  return (
    <div style={at(i * W, 0, W, H)}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 56, display: "flex", justifyContent: "space-between", fontFamily: "Consolas, monospace", fontSize: 26, fontWeight: 700, color: C.dim }}>
        <span>{topic}</span><span>{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 120 }}>
        {s.headline.map((l, k) => <Line key={k} text={l} at={2 + k * 2.4} size={size} />)}
        {s.sub && <div style={{ marginTop: 16, fontFamily: SANS, fontWeight: 900, fontSize: 38, color: C.dim, opacity: subOn, transform: `translateY(${(1 - subOn) * 14}px)` }}>{s.sub}</div>}
      </div>
      {s.kind === "cover" && <>
        <Pic name={s.prop!} style={at(470, 450, 540, 540)} />
        <Mochi pose={s.pose ?? "worried"} x={150} feet={road - 20} size={300} />
        <div style={{ ...at(150, road + 70, 240, 70), fontFamily: PUNCH, fontSize: 44, color: C.ink }}>START</div>
      </>}
      {s.kind === "stake" && <>
        <svg viewBox="-500 -500 1000 1000" style={at(140, 330, 800, 800)}>
          {Array.from({ length: 12 }, (_, k) => <path key={k} d="M0 -170 L-22 -440 L22 -440 Z" fill={C.marker} transform={`rotate(${k * 30 + f * 0.5})`} />)}
        </svg>
        <Mochi pose={s.pose ?? "wow"} x={290} feet={road - 20} size={500} />
      </>}
      {s.kind === "station" && <>
        <Pic name={s.prop!} style={s.side ? at(120, 470, 450, 450) : at(290, 450, 500, 500)} />
        {s.side && <Pic name={s.side} style={at(500, 400, 540, 600)} />}
        <Station n={s.station!} y={road} />
      </>}
      {s.kind === "recap" && (
        <div style={{ ...at(150, 450, 780, 560), background: C.card, border: `5px solid ${C.ink}`, borderRadius: 32, boxShadow: `12px 12px 0 ${C.ink}`, padding: "26px 40px" }}>
          {s.items!.map((it, k) => {
            const on = pop(f, 10 + k * 4);
            return <div key={k} style={{ display: "flex", alignItems: "center", gap: 22, height: 128, opacity: on, transform: `translateX(${(1 - on) * 40}px)` }}>
              <div style={{ width: 76, height: 76, borderRadius: 38, background: k === 1 ? C.red : C.ink, color: C.card, fontFamily: PUNCH, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>{k + 1}</div>
              <Pic name={it.prop} style={{ width: 120, height: 120 }} />
              <div style={{ fontFamily: PUNCH, fontSize: 60, color: C.ink }}>{it.title}</div>
            </div>;
          })}
          {s.note && <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 900, fontSize: 32, color: C.ink, background: C.marker, borderRadius: 12, padding: "12px 18px", display: "inline-block" }}>{s.note}</div>}
        </div>
      )}
      {s.kind === "cta" && <>
        <Pic name={s.prop ?? "building"} style={at(560, 520, 460, 480)} />
        <Mochi pose={s.pose ?? "wave"} x={110} feet={road - 20} size={320} />
        {s.location && <div style={{ ...at(90, 1170, 620, 84), background: C.red, color: C.card, fontFamily: PUNCH, fontSize: 46, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop(f, 16)})` }}>📍 {s.location}</div>}
        <div style={{ ...at(860, road + 60, 200, 70), fontFamily: PUNCH, fontSize: 44, color: C.ink }}>GOAL</div>
      </>}
      <div style={{ position: "absolute", right: 90, bottom: 40, fontFamily: "Consolas, monospace", fontSize: 24, fontWeight: 700, color: C.dim }}>{handle}</div>
    </div>
  );
};

// static scenery that crosses the cuts: trees, a sign, chevrons painted on the road
const Tree: React.FC<{ x: number }> = ({ x }) => (
  <g transform={`translate(${x} ${ROAD_Y - 60})`}>
    <rect x={-12} y={-90} width={24} height={100} fill="#8A5A2E" stroke={C.ink} strokeWidth={6} />
    <circle cx={-34} cy={-120} r={56} fill={C.tree} stroke={C.ink} strokeWidth={7} />
    <circle cx={34} cy={-136} r={64} fill="#5DB067" stroke={C.ink} strokeWidth={7} />
    <circle cx={0} cy={-190} r={52} fill={C.tree} stroke={C.ink} strokeWidth={7} />
  </g>
);

export const CardPano: React.FC<PanoProps> = ({ slides, panel, handle, topic }) => {
  const n = slides.length;
  // road: quadratic bends between cuts, level and identical at every cut
  let road = `M -60 ${ROAD_Y} L 0 ${ROAD_Y}`;
  for (let i = 0; i < n; i++) road += ` Q ${i * W + W / 2} ${ROAD_Y + (i % 2 ? BEND : -BEND)} ${(i + 1) * W} ${ROAD_Y}`;
  road += ` L ${n * W + 60} ${ROAD_Y}`;
  const cuts = Array.from({ length: n - 1 }, (_, k) => (k + 1) * W);
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -panel * W, top: 0, width: n * W, height: H }}>
        <svg width={n * W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {cuts.filter((_, k) => k % 2 === 0).map((x) => <Tree key={x} x={x} />)}
          <path d={road} stroke={C.ink} strokeWidth={104} fill="none" />
          <path d={road} stroke={C.red} strokeWidth={84} fill="none" />
          <path d={road} stroke={C.card} strokeWidth={8} fill="none" strokeDasharray="34 30" />
          {cuts.map((x) => [-60, 0, 60].map((d) => <path key={`${x}${d}`} d={`M${x + d - 14} ${ROAD_Y - 22} l 22 22 l -22 22`} stroke={C.card} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />))}
          {cuts[1] && <g transform={`translate(${cuts[1]} 0)`}>
            <rect x={-10} y={760} width={20} height={ROAD_Y - 60 - 760} fill="#8A5A2E" stroke={C.ink} strokeWidth={6} />
            <rect x={-210} y={690} width={420} height={100} rx={16} fill={C.ink} />
            <text x={0} y={760} textAnchor="middle" fontFamily={PUNCH} fontSize={56} fill={C.marker}>정답 순서 →</text>
          </g>}
        </svg>
        {slides.map((s, i) => Math.abs(i - panel) <= 1 && <Slide key={i} s={s} i={i} n={n} handle={handle} topic={topic} />)}
      </div>
    </AbsoluteFill>
  );
};
