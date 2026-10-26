import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansKR";
import { Checklist, Compare, Cta, FPS, Highlight, Hook, PUNCH, PropName, Punch, SceneSpec, Section, Stat, parse } from "./common";

// "Pulse" — short-form retention grammar (skills: short-form-video, motion-art-direction).
// Motion language (Energetic personality, kinetic-sharp):
//   easing   ease-out-expo for every entrance; springs only for slams (damping 12, ~15% overshoot)
//   unit     6 frames (0.2s); enters 6f, slams 9f, micro 3f; stagger 3f
//   cuts     hard cut + 3-frame white flash + punch-in (1.08 -> 1) at every scene start,
//            a second punch at ~55% of each scene so attention resets every 2-4s
//   holds    every scene settles >= 0.3s before its end (the still for the blog is taken there)
// Hierarchy: hero = the scene's key words/number, support = icon, texture = moving background.
// The hook text is on screen from frame 0 (no fade-up). Captions follow the narration word by word.
// All timing is real time (useCurrentFrame) so captions stay locked to the voice.

export const { fontFamily: SANS } = loadSans("normal", { weights: ["700", "900"], subsets: ["korean", "latin"] });
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

export type PulseTheme = "volt" | "fire" | "cobalt";
type T = { bg: string; bg2: string; fg: string; accent: string; dim: string; inkOnAccent: string };
const THEMES: Record<PulseTheme, T> = {
  volt: { bg: "#0D0D0F", bg2: "#1B1B20", fg: "#FFFFFF", accent: "#D7FF3A", dim: "#8A8A93", inkOnAccent: "#0D0D0F" },
  fire: { bg: "#E8261C", bg2: "#B81710", fg: "#FFFFFF", accent: "#FFE45C", dim: "#FFD0CC", inkOnAccent: "#1A0806" },
  cobalt: { bg: "#1534FF", bg2: "#0E22C2", fg: "#FFFFFF", accent: "#FFE45C", dim: "#B9C4FF", inkOnAccent: "#0A1466" },
};

export type Caption = { w: string; t: number };
type PulseScene = SceneSpec & { captions?: Caption[] };

// ---------------------------------------------------------------- motion primitives

export const enter = (f: number, at: number, len = 6) => interpolate(f, [at, at + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO });
export const slam = (f: number, at: number) => spring({ frame: f - at, fps: FPS, config: { damping: 12, stiffness: 220 } });

const Rise: React.FC<{ at: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties }> = ({ at, children, dist = 40, style }) => {
  const f = useCurrentFrame();
  const p = enter(f, at);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * dist}px)`, ...style }}>{children}</div>;
};

const Slam: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const f = useCurrentFrame();
  const p = slam(f, at);
  return <div style={{ transform: `scale(${1.6 - 0.6 * p})`, opacity: Math.min(1, p * 3), ...style }}>{children}</div>;
};

// Highlighted phrases become an accent block that wipes in left-to-right.
const Words: React.FC<{ line: string; t: T; at: number }> = ({ line, t, at }) => {
  const f = useCurrentFrame();
  const w = enter(f, at, 9);
  return (
    <>
      {parse(line).map((s, i) =>
        s.hl ? (
          <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 0.08em" }}>
            <span style={{ position: "absolute", inset: "0.06em 0", background: t.accent, transform: `scaleX(${w})`, transformOrigin: "left" }} />
            <span style={{ position: "relative", color: t.inkOnAccent }}>{s.text}</span>
          </span>
        ) : (
          <span key={i} style={{ color: s.red ? t.accent : t.fg }}>{s.text}</span>
        ),
      )}
    </>
  );
};
export const plain = (line: string) => parse(line).map((p) => p.text).join("");

// ---------------------------------------------------------------- icons (stroke, 24-unit grid)

export const ICONS: Record<string, React.ReactNode> = {
  dumbbell: <path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" />,
  stairs: <path d="M3 20h4v-4h4v-4h4V8h4V4h2" />,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 2 4 1-1 1-4 1-7z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  q: <><path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4" /><circle cx="12" cy="18" r="0.6" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  steam: <path d="M7 20c0-3 3-3 3-6s-3-3-3-6M12 20c0-3 3-3 3-6s-3-3-3-6M17 20c0-3 3-3 3-6s-3-3-3-6" />,
};
export const PROP_ICON: Record<PropName, string> = { machines: "dumbbell", stairs: "stairs", booty: "flame", bench: "dumbbell", sauna: "steam", desk: "chat", rack: "dumbbell", board: "check" };

export const Icon: React.FC<{ name: string; size: number; color: string; at: number }> = ({ name, size, color, at }) => {
  const f = useCurrentFrame();
  const p = slam(f, at);
  const draw = enter(f, at, 12);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -12}deg)`, opacity: Math.min(1, p * 3) }}>
      <g fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={80} strokeDashoffset={80 * (1 - draw)}>{ICONS[name]}</g>
    </svg>
  );
};

// ---------------------------------------------------------------- frame: background, flash, punch, captions

const Background: React.FC<{ theme: PulseTheme; t: T }> = ({ theme, t }) => {
  const f = useCurrentFrame();
  if (theme === "volt") {
    const off = (f * 3) % 90;
    return (
      <AbsoluteFill style={{ background: t.bg }}>
        <AbsoluteFill style={{ backgroundImage: `linear-gradient(${t.bg2} 2px, transparent 2px), linear-gradient(90deg, ${t.bg2} 2px, transparent 2px)`, backgroundSize: "90px 90px", backgroundPosition: `0 ${off}px` }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, transparent 0, ${t.bg} 75%)` }} />
      </AbsoluteFill>
    );
  }
  if (theme === "fire") {
    const off = (f * 9) % 160;
    return <AbsoluteFill style={{ background: `repeating-linear-gradient(-28deg, ${t.bg} 0 80px, ${t.bg2} 80px 160px)`, backgroundPosition: `${off}px 0` }} />;
  }
  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      {[0, 1, 2].map((k) => {
        const r = ((f * 4 + k * 260) % 780) + 120;
        return <div key={k} style={{ position: "absolute", left: 540 - r, top: 400 - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${t.bg2}`, opacity: 1 - r / 900 }} />;
      })}
    </AbsoluteFill>
  );
};

const CaptionBar: React.FC<{ captions?: Caption[]; t: T }> = ({ captions, t }) => {
  const f = useCurrentFrame();
  if (!captions?.length) return null;
  const sec = f / FPS;
  // 3-word chunks; show the chunk that holds the current word
  const chunks: Caption[][] = [];
  captions.forEach((c, i) => (i % 3 === 0 ? chunks.push([c]) : chunks[chunks.length - 1].push(c)));
  let ci = 0;
  chunks.forEach((ch, i) => { if (sec >= ch[0].t) ci = i; });
  const chunk = chunks[ci];
  const pop = enter(f, Math.round(chunk[0].t * FPS), 4);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 70, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(0,0,0,0.78)", borderRadius: 18, padding: "14px 26px", fontFamily: SANS, fontWeight: 900, fontSize: 46, letterSpacing: -1, transform: `scale(${0.92 + 0.08 * pop})`, opacity: pop }}>
        {chunk.map((c, i) => (
          <span key={i} style={{ color: sec >= c.t ? t.accent : "#FFFFFF", marginRight: i < chunk.length - 1 ? 14 : 0 }}>{c.w}</span>
        ))}
      </div>
    </div>
  );
};

const Frame: React.FC<{ theme: PulseTheme; s: PulseScene; children: React.ReactNode; align?: "center" | "left" }> = ({ theme, s, children, align = "center" }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const mid = Math.round(durationInFrames * 0.55);
  const punch = interpolate(f, [0, 6], [1.08, 1], { extrapolateRight: "clamp", easing: EXPO }) * (1 + 0.035 * enter(f, mid, 4) - 0.035 * enter(f, mid + 4, 8));
  const flash = interpolate(f, [0, 3], [0.85, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: t.fg }}>
      <Background theme={theme} t={t} />
      <AbsoluteFill style={{ padding: "90px 80px 190px", justifyContent: "center", alignItems: align === "center" ? "center" : "flex-start", textAlign: align, transform: `scale(${punch})` }}>
        {children}
      </AbsoluteFill>
      <CaptionBar captions={s.captions} t={t} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const H: React.FC<{ size: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, children, style }) => (
  <div style={{ fontFamily: PUNCH, fontSize: size, lineHeight: 1.12, letterSpacing: -1, wordBreak: "keep-all", ...style }}>{children}</div>
);

// ---------------------------------------------------------------- scenes

const HookP: React.FC<{ s: Hook & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  return (
    <Frame theme={theme} s={s}>
      {/* on screen from frame 0: the open loop */}
      <div style={{ marginBottom: 26 }}><Icon name="q" size={150} color={t.accent} at={0} /></div>
      <H size={64} style={{ color: t.dim }}>{s.lines.map(plain).join(" ")}</H>
      <Slam at={6} style={{ marginTop: 26 }}><H size={92}><Words line={s.reveal} t={t} at={14} /></H></Slam>
    </Frame>
  );
};

const SectionP: React.FC<{ s: Section & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  const f = useCurrentFrame();
  const x = enter(f, 0, 9);
  return (
    <Frame theme={theme} s={s} align="left">
      <div style={{ position: "absolute", right: -30, top: 30, fontFamily: PUNCH, fontSize: 560, lineHeight: 1, color: t.accent, opacity: 0.95, transform: `translateX(${(1 - x) * 260}px)` }}>{s.num}</div>
      <div style={{ marginTop: 330, position: "relative" }}>
        <Rise at={3}><div style={{ display: "inline-block", background: t.accent, color: t.inkOnAccent, fontWeight: 900, fontSize: 34, padding: "6px 16px", borderRadius: 8 }}>POINT {s.num}</div></Rise>
        <Rise at={6}><H size={96} style={{ marginTop: 18 }}><Words line={s.title} t={t} at={14} /></H></Rise>
      </div>
    </Frame>
  );
};

const HighlightP: React.FC<{ s: Highlight & PulseScene; theme: PulseTheme; index: number }> = ({ s, theme, index }) => {
  const t = THEMES[theme];
  const order: PropName[] = ["machines", "booty", "stairs", "sauna", "desk", "rack"];
  const icon = PROP_ICON[s.prop ?? order[index % order.length]];
  return (
    <Frame theme={theme} s={s}>
      <div style={{ marginBottom: 30 }}><Icon name={icon} size={130} color={t.accent} at={0} /></div>
      {s.lines.map((l, i) => (
        <Rise key={i} at={3 + i * 3}><H size={s.lines.length > 2 ? 76 : 88}><Words line={l} t={t} at={12 + s.lines.length * 3} /></H></Rise>
      ))}
    </Frame>
  );
};

const StatP: React.FC<{ s: Stat & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  const f = useCurrentFrame();
  const m = s.value.match(/^(\d+)(.*)$/);
  const shown = m ? `${Math.round(interpolate(f, [4, 22], [0, Number(m[1])], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO }))}${m[2]}` : s.value;
  const n = Math.max(1, Math.min(8, s.count ?? (m ? Number(m[1]) : 1)));
  return (
    <Frame theme={theme} s={s}>
      {s.kicker ? <Rise at={0}><div style={{ fontWeight: 900, fontSize: 44, color: t.dim }}>{s.kicker}</div></Rise> : null}
      <Slam at={2}><H size={s.value.length > 4 ? 240 : 330} style={{ color: t.accent, lineHeight: 1 }}>{shown}</H></Slam>
      <div style={{ display: "flex", gap: 14, margin: "8px 0 22px" }}>
        {Array.from({ length: n }, (_, i) => <Icon key={i} name={PROP_ICON[s.prop ?? "stairs"]} size={n > 5 ? 62 : 80} color={t.fg} at={10 + i * 3} />)}
      </div>
      <Rise at={14}><H size={60}><Words line={s.caption} t={t} at={22} /></H></Rise>
    </Frame>
  );
};

const CompareP: React.FC<{ s: Compare & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  const col = (label: string, vals: string[], good: boolean, at: number) => (
    <div style={{ flex: 1, background: good ? t.accent : "rgba(0,0,0,0.28)", color: good ? t.inkOnAccent : t.fg, borderRadius: 26, padding: "34px 30px", textAlign: "left" }}>
      <Rise at={at}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Icon name={good ? "check" : "x"} size={56} color={good ? t.inkOnAccent : t.dim} at={at} /><span style={{ fontWeight: 900, fontSize: 40 }}>{label}</span></div></Rise>
      {vals.map((v, i) => (
        <Rise key={i} at={at + 4 + i * 3}><div style={{ marginTop: 22 }}><div style={{ fontWeight: 700, fontSize: 28, opacity: 0.7 }}>{s.rows[i][0]}</div><div style={{ fontFamily: PUNCH, fontSize: 58, lineHeight: 1.15, textDecoration: good ? "none" : "line-through", textDecorationThickness: 4 }}>{v}</div></div></Rise>
      ))}
    </div>
  );
  return (
    <Frame theme={theme} s={s}>
      <div style={{ display: "flex", gap: 26, width: "100%" }}>
        {col(s.left, s.rows.map((r) => r[1]), false, 0)}
        {col(s.right, s.rows.map((r) => r[2]), true, 6)}
      </div>
    </Frame>
  );
};

const PunchP: React.FC<{ s: Punch & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  const f = useCurrentFrame();
  const shake = f > 3 && f < 14 ? Math.sin(f * 2.6) * (14 - f) * 1.4 : 0;
  return (
    <Frame theme={theme} s={s}>
      <Slam at={0}><H size={s.word.length > 4 ? 210 : 290} style={{ color: t.accent, transform: `translateX(${shake}px)` }}>{s.word}</H></Slam>
      {s.sub ? <Rise at={10}><H size={54} style={{ marginTop: 20 }}>{plain(s.sub)}</H></Rise> : null}
    </Frame>
  );
};

const ChecklistP: React.FC<{ s: Checklist & PulseScene; theme: PulseTheme }> = ({ s, theme }) => {
  const t = THEMES[theme];
  return (
    <Frame theme={theme} s={s} align="left">
      <Rise at={0}><H size={70} style={{ marginBottom: 24 }}>{plain(s.title).replace(/^[^\p{L}\p{N}]+/u, "")}</H></Rise>
      {s.items.slice(0, 4).map((it, i) => (
        <Rise key={i} at={5 + i * 4}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 18 }}>
            <div style={{ flex: "none", width: 70, height: 70, borderRadius: 16, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={52} color={t.inkOnAccent} at={7 + i * 4} /></div>
            <div style={{ fontWeight: 900, fontSize: s.items.length > 3 ? 44 : 52, lineHeight: 1.25, wordBreak: "keep-all" }}>{plain(it)}</div>
          </div>
        </Rise>
      ))}
    </Frame>
  );
};

const CtaP: React.FC<{ s: Cta & PulseScene; theme: PulseTheme; brand: string }> = ({ s, theme, brand }) => {
  const t = THEMES[theme];
  return (
    <Frame theme={theme} s={s}>
      <Slam at={0}><H size={170} style={{ letterSpacing: 6 }}>CITYGYM</H></Slam>
      <Rise at={6}><div style={{ fontWeight: 900, fontSize: 64, marginTop: 6 }}>{brand}</div></Rise>
      <Rise at={12} style={{ marginTop: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: t.accent, color: t.inkOnAccent, borderRadius: 999, padding: "16px 34px" }}>
          <Icon name="pin" size={54} color={t.inkOnAccent} at={14} />
          <span style={{ fontWeight: 900, fontSize: 44 }}>{s.location}</span>
        </div>
      </Rise>
      <Rise at={18}><div style={{ fontWeight: 700, fontSize: 40, marginTop: 26, color: t.dim }}>{plain(s.line)}</div></Rise>
    </Frame>
  );
};

export const makeRenderPulse = (theme: PulseTheme) => (s: SceneSpec, brand: string, index: number) => {
  const p = s as PulseScene;
  switch (p.type) {
    case "hook": return <HookP s={p} theme={theme} />;
    case "section": return <SectionP s={p} theme={theme} />;
    case "highlight": return <HighlightP s={p} theme={theme} index={index} />;
    case "stat": return <StatP s={p} theme={theme} />;
    case "compare": return <CompareP s={p} theme={theme} />;
    case "punch": return <PunchP s={p} theme={theme} />;
    case "checklist": return <ChecklistP s={p} theme={theme} />;
    case "cta": return <CtaP s={p} theme={theme} brand={brand} />;
  }
};

// Thin progress bar across the whole video (retention cue).
export const PulseProgress: React.FC<{ theme: PulseTheme }> = ({ theme }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${(f / durationInFrames) * 100}%`, background: THEMES[theme].accent }} />;
};
