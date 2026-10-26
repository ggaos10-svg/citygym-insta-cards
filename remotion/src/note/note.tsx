import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS, PUNCH, PropName, SceneSpec, parse } from "./common";
import { Caption, SANS, enter, plain, slam } from "./pulse";
import { CODE_PROPS } from "../art/Art";

// "Note" — modelled on the reference reel (reference/ref.mp4): cream paper, mono header line,
// a bold headline that writes itself word by word with the narration, a dense "app window" card
// holding a hand-drawn isometric illustration, a terminal card and a sticker layered around it,
// a cursor that clicks, and the CityGym mascot reacting bottom-right.
// Every illustration and the mascot are drawn in code: src/art/Art.tsx.

export const N = { paper: "#F4EFE6", ink: "#1E1A16", accent: "#F0532A", dim: "#8C857B", line: "#D9D1C4", card: "#FFFDF8", term: "#1C1B1F" };
export const MONO = "Consolas, 'D2Coding', monospace";

export type NoteScene = SceneSpec & { captions?: Caption[]; left_prop?: string };
type Pose = "wave" | "point" | "wow" | "thumbs" | "worried" | "cheer";

export const POSE: Record<SceneSpec["type"], Pose> = {
  hook: "worried", section: "wave", highlight: "point", stat: "wow", compare: "thumbs", punch: "cheer", checklist: "point", cta: "wave",
};
export const LABEL: Record<SceneSpec["type"], string> = { hook: "질문", section: "포인트", highlight: "핵심", stat: "숫자", compare: "비교", punch: "반전", checklist: "정리", cta: "위치" };
const order: PropName[] = ["machines", "booty", "stairs", "sauna", "desk", "rack"];
// a prop drawn in code (art/Art.tsx); the checker only lets known names through
export const Pic: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) => {
  const Art = CODE_PROPS[name];
  return Art ? <div style={style}><Art /></div> : null;
};

// ---------------------------------------------------------------- headline: the narration, word by word

const hlWords = (s: SceneSpec) => {
  const texts = ["lines" in s ? s.lines : [], "reveal" in s ? [s.reveal] : [], "title" in s ? [s.title] : [], "caption" in s ? [s.caption] : []].flat();
  return texts.flatMap((t) => parse(t).filter((p) => p.hl || p.red).flatMap((p) => p.text.split(/\s+/)));
};

const Headline: React.FC<{ s: NoteScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const keys = hlWords(s);
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, lineHeight: 1.25, letterSpacing: -1.5, wordBreak: "keep-all" }}>
      {(s.captions ?? []).map((c, i) => {
        const on = enter(f, Math.round(c.t * FPS), 4);
        const key = keys.some((k) => k && (c.w.includes(k) || k.includes(c.w.replace(/[,.?!]/g, ""))));
        return (
          <span key={i} style={{ opacity: on, display: "inline-block", transform: `translateY(${(1 - on) * 12}px)`, marginRight: 13, color: key ? N.accent : N.ink, textDecoration: key ? "underline" : "none", textUnderlineOffset: 8, textDecorationThickness: 4 }}>
            {c.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- layered UI pieces

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; tilt?: number }> = ({ at, children, style, tilt = 0 }) => {
  const f = useCurrentFrame();
  const p = slam(f, at);
  return <div style={{ position: "absolute", transform: `scale(${0.85 + 0.15 * p}) rotate(${tilt}deg)`, opacity: Math.min(1, p * 3), ...style }}>{children}</div>;
};

// App window: tab "Fig. 0N — label", URL bar, button list on the left, illustration on the right.
const Window: React.FC<{ fig: string; slug: string; pills: string[]; image?: string; corner?: React.ReactNode; gray?: boolean; w?: number; h?: number; split?: number }> = ({ fig, slug, pills, image, corner, gray, w = 690, h = 560, split = 0.36 }) => {
  const stack = split >= 1; // pills on top, illustration full width below
  const f = useCurrentFrame();
  const float = Math.sin(f / 14) * 5;
  return (
    <div style={{ position: "relative", width: w, height: h, background: N.card, border: `3px solid ${N.ink}`, borderRadius: 14, boxShadow: `7px 7px 0 ${N.ink}`, overflow: "hidden", fontFamily: MONO, color: N.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderBottom: `2px solid ${N.ink}`, background: "#EFE8DC" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
        <span style={{ marginLeft: 10, border: `2px solid ${N.ink}`, borderBottom: "none", borderRadius: "6px 6px 0 0", padding: "2px 12px", fontSize: 15, fontWeight: 700, background: N.card }}>{fig}</span>
      </div>
      <div style={{ margin: "8px 12px", border: `1.5px solid ${N.line}`, borderRadius: 999, padding: "3px 14px", fontSize: 14, color: N.dim }}>citygym-geumho.kr/#{slug}</div>
      <div style={{ display: "flex", flexDirection: stack ? "column" : "row", padding: "4px 14px", height: h - 120 }}>
        <div style={{ width: stack ? "100%" : w * split, display: "flex", flexDirection: "column", gap: 9, paddingTop: 6 }}>
          <div style={{ fontSize: 13, color: N.dim, letterSpacing: 1 }}>{fig.toUpperCase().slice(0, 7)} · OPTIONS</div>
          {pills.slice(0, 4).map((p, i) => (
            <div key={i} style={{ opacity: enter(f, 8 + i * 3), border: `1.8px solid ${N.ink}`, borderRadius: 999, padding: "6px 14px", fontFamily: SANS, fontWeight: 800, fontSize: 25, background: i === 1 ? N.accent : "transparent", color: i === 1 ? "#fff" : N.ink, wordBreak: "keep-all" }}>{p}</div>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          {image ? <Pic name={image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `translateY(${float}px)`, filter: gray ? "grayscale(1) opacity(0.7)" : "none" }} /> : null}
          {corner ? <div style={{ position: "absolute", right: 4, top: 0, textAlign: "right" }}>{corner}</div> : null}
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: N.dim }}>
        <span>HAND-DRAWN</span>
        <div style={{ flex: 1, height: 3, background: N.line, position: "relative" }}><div style={{ position: "absolute", left: `${30 + 10 * Math.sin(f / 20)}%`, top: -5, width: 13, height: 13, borderRadius: 7, background: N.ink }} /></div>
        {["#F0532A", "#FEBC2E", "#3FA37A", "#4A6CF7"].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, border: `1.5px solid ${N.ink}` }} />)}
      </div>
    </div>
  );
};

// Small dark terminal that types its line.
const Terminal: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  const n = Math.floor(Math.max(0, f - at) * 0.9);
  return (
    <div style={{ width: 330, background: N.term, borderRadius: 10, border: `2px solid ${N.ink}`, padding: "10px 14px", fontFamily: MONO, fontSize: 15, color: "#E9E4DA", boxShadow: `5px 5px 0 ${N.ink}` }}>
      <div style={{ color: "#8D8A93", fontSize: 12, marginBottom: 6 }}>●●● citygym — ~/geumho</div>
      <div><span style={{ color: N.accent }}>&gt;</span> {text.slice(0, n)}<span style={{ opacity: f % 16 < 8 ? 1 : 0 }}>▍</span></div>
    </div>
  );
};

const Sticker: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ background: N.ink, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 18, padding: "7px 16px", borderRadius: 999, border: "2px solid #fff", boxShadow: `3px 3px 0 ${N.accent}` }}>{text}</div>
);

// Arrow cursor that glides to (x, y) and clicks.
const Cursor: React.FC<{ from: [number, number]; to: [number, number]; at: number }> = ({ from, to, at }) => {
  const f = useCurrentFrame();
  const p = enter(f, at, 14);
  const click = f > at + 16 && f < at + 22 ? 0.85 : 1;
  return (
    <svg width={44} height={52} viewBox="0 0 22 26" style={{ position: "absolute", left: from[0] + (to[0] - from[0]) * p, top: from[1] + (to[1] - from[1]) * p, transform: `scale(${click})`, opacity: Math.min(1, p * 4) }}>
      <path d="M2 2l16 10-7 1.5L7.5 21z" fill="#fff" stroke={N.ink} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
};

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 64, color = N.ink }) => (
  <div style={{ fontFamily: PUNCH, fontSize: size, lineHeight: 1.1, color, wordBreak: "keep-all" }}>{children}</div>
);

// ---------------------------------------------------------------- per-scene composition of the middle area

export const middle = (s: NoteScene, brand: string, index: number) => {
  const fig = `Fig. ${String(index + 1).padStart(2, "0")} — ${LABEL[s.type]}`;
  switch (s.type) {
    case "hook": {
      const prop = s.prop ?? "machines";
      return <>
        <Pop at={0} style={{ left: 0, top: 0 }}><Terminal text={plain(s.lines[0] ?? "")} at={2} /></Pop>
        <Pop at={4} style={{ left: 40, top: 70 }}><Window fig={fig} slug={prop} pills={s.lines.map(plain)} image={prop} corner={<Big size={40} color={N.accent}>?</Big>} /></Pop>
        <Pop at={10} style={{ left: 430, top: 52 }} tilt={-6}><Sticker text={plain(s.reveal)} /></Pop>
        <Cursor from={[560, 520]} to={[296, 262]} at={16} />
      </>;
    }
    case "section": return <>
      <Pop at={2} style={{ left: 40, top: 40 }}><Window fig={fig} slug={`point-${s.num}`} pills={[plain(s.title)]} image={s.prop ?? order[s.num % order.length]} corner={<Big size={110} color={N.accent}>{String(s.num).padStart(2, "0")}</Big>} /></Pop>
    </>;
    case "highlight": {
      const prop = s.prop ?? order[index % order.length];
      return <>
        <Pop at={2} style={{ left: 40, top: 50 }}><Window fig={fig} slug={prop} pills={s.lines.map(plain)} image={prop} /></Pop>
        <Pop at={10} style={{ left: 380, top: 24 }} tilt={5}><Sticker text="시티짐 금호점" /></Pop>
        <Cursor from={[560, 540]} to={[296, 300]} at={14} />
      </>;
    }
    case "stat": {
      const prop = s.prop ?? "stairs";
      return <>
        <Pop at={2} style={{ left: 40, top: 60 }}><Window fig={fig} slug={prop} pills={[s.kicker ?? "", plain(s.caption)].filter(Boolean)} image={prop}
          corner={<div style={{ background: N.term, borderRadius: 10, padding: "6px 16px" }}><div style={{ fontFamily: MONO, fontSize: 12, color: "#9A97A0", letterSpacing: 2 }}>TOTAL</div><Big size={74} color={N.accent}>{s.value}</Big></div>} /></Pop>
        <Pop at={8} style={{ left: 0, top: 0 }}><Terminal text={`count --${prop}  → ${s.value}`} at={10} /></Pop>
      </>;
    }
    case "compare": return <>
      <Pop at={0} style={{ left: -10, top: 30 }} tilt={-2}><Window fig={`${s.left}`} slug="before" pills={s.rows.map((r) => r[0] ? `${r[0]} · ${r[1]}` : r[1])} image={s.left_prop ?? "bench"} gray w={400} h={560} split={1} /></Pop>
      <Pop at={6} style={{ left: 330, top: 80 }} tilt={2}><Window fig={`${s.right}`} slug="after" pills={s.rows.map((r) => r[0] ? `${r[0]} · ${r[2]}` : r[2])} image={s.prop ?? "booty"} w={400} h={560} split={1} /></Pop>
      <Pop at={12} style={{ left: 300, top: 14 }} tilt={-8}><Sticker text="VS" /></Pop>
    </>;
    case "punch": return <>
      <Pop at={0} style={{ left: 60, top: 110 }} tilt={-3}>
        <div style={{ background: N.card, border: `3px solid ${N.ink}`, borderRadius: 16, boxShadow: `8px 8px 0 ${N.accent}`, padding: "34px 44px" }}>
          <Big size={140} color={N.accent}>{s.word}</Big>{s.sub ? <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 32, marginTop: 10 }}>{plain(s.sub)}</div> : null}
        </div>
      </Pop>
    </>;
    case "checklist": return <>
      <Pop at={2} style={{ left: 40, top: 50 }}><Window fig={fig} slug="summary" pills={s.items.map((i) => `✓ ${plain(i)}`)} image="board" /></Pop>
      <Cursor from={[560, 540]} to={[296, 296]} at={14} />
    </>;
    case "cta": return <>
      <Pop at={2} style={{ left: 40, top: 40 }}><Window fig={`CITYGYM — ${brand}`} slug="visit" pills={[plain(s.line), s.location]} image="building" /></Pop>
      <Pop at={10} style={{ left: 300, top: 380 }}><Pic name="subway" style={{ width: 220, height: 230 }} /></Pop>
      <Pop at={14} style={{ left: 330, top: 26 }} tilt={-5}><Sticker text={`📍 ${s.location}`} /></Pop>
    </>;
  }
};
