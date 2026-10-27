import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { Mascot, Pose, SHADOW } from "../art/Art";
import { N, NoteScene, Pic } from "./note";
import { SANS, plain } from "./pulse";

// Alternative middle-stage scenes for the Note card (720x620 stage, scaled by CardNote).
// Same paper, ink, orange and blue shadow as the app-window scene; only the composition and the
// way things enter change, so a carousel can switch scene every slide without losing its look
// (motion-art-direction: one easing family, a spring with ~15% overshoot, everywhere).
// "big" is not here: it replaces the whole card layout (see CardNote).

export type SceneName = "app" | "big" | "comic" | "diagram" | "memo" | "diorama";
// which scenes each slide type can use; the first one is the default, chosen so that a post
// written without any `scene` already changes look from slide to slide
export const SCENES: Record<NoteScene["type"], SceneName[]> = {
  hook: ["big", "comic", "app"], highlight: ["comic", "diagram", "app"], section: ["diagram", "app"],
  stat: ["app", "big"], compare: ["app"], punch: ["big"], checklist: ["memo", "app"], cta: ["diorama", "app"],
};
// comic needs exactly two lines (one per panel); a highlight with three falls back to diagram
export const defaultScene = (s: NoteScene): SceneName =>
  s.type === "highlight" && s.lines.length !== 2 ? "diagram" : SCENES[s.type][0];

const sp = (f: number, at: number, damping = 12) => spring({ frame: f - at, fps: 30, config: { damping, stiffness: 170 } });
const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: x, top: y, width: w, height: h });
const PANEL_POSES: Pose[][] = [["worried", "wow"], ["point", "thumbs"]];

// Two comic panels, one per line, each with the mascot reacting under a speech bubble.
const Comic: React.FC<{ s: NoteScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const lines = ("lines" in s ? s.lines : []).slice(0, 2);
  const poses = PANEL_POSES[s.type === "hook" ? 0 : 1];
  return <>{lines.map((line, i) => {
    const p = sp(f, 4 + i * 12);
    return (
      <div key={i} style={{ ...box(i * 366, 20 + i * 24, 340, 560), background: i ? "#FFE9DC" : N.card, border: `4px solid ${N.ink}`, borderRadius: 12,
        boxShadow: `8px 8px 0 ${SHADOW}`, transform: `scale(${0.8 + 0.2 * p}) rotate(${(i ? 2 : -2) * p}deg)`, opacity: Math.min(1, p * 2), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 18, top: 10, fontFamily: SANS, fontWeight: 900, fontSize: 30, color: N.dim }}>#{i + 1}</div>
        <div style={{ position: "absolute", left: 20, right: 20, top: 58, background: "#fff", border: `3px solid ${N.ink}`, borderRadius: 24, padding: "14px 16px",
          fontFamily: SANS, fontWeight: 900, fontSize: 40, lineHeight: 1.2, textAlign: "center", wordBreak: "keep-all" }}>
          {plain(line)}
          <div style={{ position: "absolute", left: "46%", bottom: -22, width: 30, height: 30, background: "#fff", borderRight: `3px solid ${N.ink}`, borderBottom: `3px solid ${N.ink}`, transform: "rotate(45deg)" }} />
        </div>
        <div style={box(40, 230, 260, 312)}><Mascot pose={poses[i]} /></div>
      </div>
    );
  })}</>;
};

// A big illustration with labels on the right joined to it by leader lines that draw in.
const Diagram: React.FC<{ s: NoteScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const labels = s.type === "section" ? [s.title] : "lines" in s ? s.lines : [];
  const targets = [[300, 230], [270, 340], [330, 430]];
  const prop = s.prop ?? "machines";
  return <>
    <div style={{ ...box(-10, 30, 480, 520), transform: `scale(${0.85 + 0.15 * sp(f, 2)})` }}><Pic name={prop} style={{ width: "100%", height: "100%" }} /></div>
    {s.type === "section" && <div style={{ ...box(10, 10, 120, 120), borderRadius: 60, background: N.accent, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 70,
      display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${N.ink}`, transform: `scale(${sp(f, 8, 9)})` }}>{s.num}</div>}
    <svg width={720} height={620} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {labels.map((_, i) => {
        const y = 150 + i * 130, [tx, ty] = targets[i] ?? targets[0];
        const len = Math.hypot(470 - tx, y - ty);
        const draw = Math.min(1, Math.max(0, (f - 12 - i * 6) / 10));
        return <g key={i}>
          <path d={`M470 ${y} L${tx} ${ty}`} stroke={N.ink} strokeWidth={4} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
          <circle cx={tx} cy={ty} r={10 * draw} fill={N.accent} stroke={N.ink} strokeWidth={3} />
        </g>;
      })}
    </svg>
    {labels.map((l, i) => {
      const p = sp(f, 8 + i * 6);
      return <div key={i} style={{ ...box(470, 120 + i * 130, 260, 80), display: "flex", alignItems: "center", background: i === 0 ? N.accent : N.card, color: i === 0 ? "#fff" : N.ink,
        border: `3px solid ${N.ink}`, borderRadius: 20, padding: "0 16px", fontFamily: SANS, fontWeight: 900, fontSize: 36, lineHeight: 1.1, wordBreak: "keep-all",
        transform: `translateX(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 2) }}>{plain(l)}</div>;
    })}
  </>;
};

// Sticky notes slapped onto the stage one by one, each with a check that draws itself.
const COLORS = ["#FFE27A", "#FFC9B0", "#BFE8C8", "#C8D8FF"];
const Memo: React.FC<{ s: NoteScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const items = s.type === "checklist" ? s.items : [];
  const spots = [[10, 20], [370, 40], [20, 320], [380, 340]];
  return <>{items.slice(0, 4).map((it, i) => {
    const p = sp(f, 4 + i * 7, 10), tick = Math.min(1, Math.max(0, (f - 14 - i * 7) / 8));
    const [x, y] = spots[i];
    return (
      <div key={i} style={{ ...box(x, y, 330, 260), background: COLORS[i], border: `3px solid ${N.ink}`, borderRadius: 6, boxShadow: `7px 7px 0 ${SHADOW}`,
        transform: `scale(${1.3 - 0.3 * p}) rotate(${[-4, 3, 2, -3][i] * p}deg)`, opacity: Math.min(1, p * 2), padding: "70px 24px 0" }}>
        <div style={{ position: "absolute", left: 120, top: -16, width: 90, height: 30, background: "rgba(255,255,255,0.7)", border: `2px solid ${N.ink}`, transform: "rotate(-3deg)" }} />
        <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", left: 20, top: 16 }}>
          <rect x={4} y={4} width={44} height={44} rx={8} fill="#fff" stroke={N.ink} strokeWidth={4} />
          <path d="M12 26 l10 10 l22 -26" stroke={N.accent} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - tick)} />
        </svg>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 46, lineHeight: 1.15, wordBreak: "keep-all" }}>{plain(it)}</div>
      </div>
    );
  })}</>;
};

// An isometric street corner: platform, the gym building dropping in, the subway exit, trees.
const Diorama: React.FC<{ s: NoteScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const drop = sp(f, 6, 11), slab = sp(f, 0, 14);
  return <>
    <svg width={720} height={620} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(360 470) scale(${slab}) translate(-360 -470)`}>
        <polygon points="360,330 700,470 360,610 20,470" fill={SHADOW} transform="translate(-16 14)" />
        <polygon points="360,330 700,470 360,610 20,470" fill="#E9DFCE" stroke={N.ink} strokeWidth={5} />
        <polygon points="20,470 360,610 360,630 20,490" fill="#CDBB9F" stroke={N.ink} strokeWidth={4} />
        <polygon points="700,470 360,610 360,630 700,490" fill="#B8A589" stroke={N.ink} strokeWidth={4} />
        {[[120, 450], [600, 455], [470, 540]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
          <rect x={-6} y={-40} width={12} height={44} fill="#8A5A2E" stroke={N.ink} strokeWidth={4} />
          <circle cx={0} cy={-60} r={30} fill="#5DB067" stroke={N.ink} strokeWidth={5} />
        </g>)}
      </g>
    </svg>
    <div style={{ ...box(300, 40, 380, 450), transform: `translateY(${(1 - drop) * -400}px)` }}><Pic name="building" style={{ width: "100%", height: "100%" }} /></div>
    <div style={{ ...box(70, 330, 230, 230), transform: `scale(${sp(f, 14)})` }}><Pic name="subway" style={{ width: "100%", height: "100%" }} /></div>
    {s.type === "cta" && <div style={{ ...box(10, 20, 330, 0), height: "auto", background: N.card, border: `3px solid ${N.ink}`, borderRadius: 22, padding: "14px 18px",
      boxShadow: `6px 6px 0 ${N.accent}`, fontFamily: SANS, fontWeight: 900, fontSize: 40, lineHeight: 1.2, whiteSpace: "pre-line", transform: `scale(${sp(f, 18, 10)})` }}>{plain(s.line)}</div>}
    {s.type === "cta" && <div style={{ ...box(30, 230, 300, 64), background: N.ink, color: "#fff", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: SANS, fontWeight: 900, fontSize: 30, transform: `scale(${sp(f, 24, 10)})` }}>📍 {s.location}</div>}
  </>;
};

export const sceneMiddle = (s: NoteScene, scene: SceneName) => {
  switch (scene) {
    case "comic": return <Comic s={s} />;
    case "diagram": return <Diagram s={s} />;
    case "memo": return <Memo s={s} />;
    case "diorama": return <Diorama s={s} />;
    default: return null;
  }
};
