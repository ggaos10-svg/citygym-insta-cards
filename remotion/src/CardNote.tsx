import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LABEL, MONO, N, NoteScene, POSE, middle } from "./note/note";
import { Mascot } from "./art/Art";
import { PUNCH, parse } from "./note/common";
import { SceneName, defaultScene, sceneMiddle } from "./note/scenes";
import { SANS, enter, plain, slam } from "./note/pulse";

// Card-news slide in the blog's "Note" look (cream paper, mono header, bold headline writing
// itself word by word, app-window card with an isometric prop, the CityGym mascot reacting),
// re-laid out for a 1080x1350 Instagram carousel slide.
export type CardSlide = NoteScene & { headline: string; next?: string; scene?: SceneName };
export type CardProps = { slide: CardSlide; idx: number; total: number };

// Headline: 100px, one line per "\n" in the copy (the checker keeps each line short enough to fit),
// written a word at a time.
const Headline: React.FC<{ text: string; size?: number; color?: string }> = ({ text, size = 100, color = N.ink }) => {
  const f = useCurrentFrame();
  let i = 0;
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1.18, color, letterSpacing: -2.5, wordBreak: "keep-all" }}>
      {parse(text).flatMap((part, pi) =>
        part.text.split(/(\n|\s+)/).filter(Boolean).map((w, wi) => {
          if (w === "\n") return <br key={`${pi}-${wi}`} />;
          if (!w.trim()) return <span key={`${pi}-${wi}`}> </span>;
          const on = enter(f, 6 + i++ * 3, 5); // a word every 0.1 s, like the narration-timed reel
          const key = part.hl || part.red;
          return (
            <span key={`${pi}-${wi}`} style={{
              display: "inline-block", opacity: on, transform: `translateY(${(1 - on) * 14}px)`,
              color: key ? N.accent : color, textDecoration: key ? "underline" : "none", textUnderlineOffset: 14, textDecorationThickness: 8,
            }}>{w}</span>
          );
        }),
      )}
    </div>
  );
};

// "big" scene: dark full-bleed card where the headline itself is the picture, with one hero
// element under it (the hook's reveal, the stat's number, the punch word). Pattern interrupt.
const BigScene: React.FC<{ slide: CardSlide }> = ({ slide }) => {
  const f = useCurrentFrame();
  const p = slam(f, 22);
  const s = slide;
  const hero = s.type === "stat" ? s.value : s.type === "punch" ? s.word : s.type === "hook" ? plain(s.reveal) : "";
  const heroSize = s.type === "hook" ? 64 : 240;
  return <>
    <div style={{ position: "absolute", left: 64, right: 64, top: 230 }}><Headline text={s.headline} size={120} color="#F6EFE4" /></div>
    {hero && <div style={{ position: "absolute", left: 64, top: s.type === "hook" ? 640 : 560, transform: `scale(${0.6 + 0.4 * p}) rotate(${-4 * p}deg)`, transformOrigin: "left center", opacity: Math.min(1, p * 2) }}>
      {s.type === "hook"
        ? <div style={{ background: N.accent, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: heroSize, padding: "14px 36px", borderRadius: 999, border: "4px solid #F6EFE4" }}>{hero} ↓</div>
        : <div style={{ fontFamily: PUNCH, fontSize: heroSize, lineHeight: 1, color: N.accent }}>{hero}</div>}
    </div>}
    {s.type === "punch" && s.sub && <div style={{ position: "absolute", left: 64, top: 830, fontFamily: SANS, fontWeight: 900, fontSize: 50, color: "#F6EFE4", opacity: enter(f, 30, 8) }}>{plain(s.sub)}</div>}
    {s.type === "stat" && <div style={{ position: "absolute", left: 64, top: 830, fontFamily: SANS, fontWeight: 900, fontSize: 50, color: "#F6EFE4", opacity: enter(f, 30, 8) }}>{plain(s.caption)}</div>}
  </>;
};

export const CardNote: React.FC<CardProps> = ({ slide, idx, total }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pop = slam(f, 4);
  const bob = Math.sin(f / 8) * 6;
  const plus = (x: number, y: number) => <span style={{ position: "absolute", left: x, top: y, color: N.accent, fontSize: 34, fontWeight: 700 }}>+</span>;
  const nextOn = enter(f, 40, 10);
  // the mascot already acts inside these illustrations, so the corner one would be a duplicate
  const showsMascot = [slide.prop, (slide as { left_prop?: string }).left_prop].some((p) => p && /^(squat_|chair)/.test(p));
  const scene = slide.scene ?? defaultScene(slide);
  const big = scene === "big";
  const cream = "#F6EFE4";
  return (
    <AbsoluteFill style={{ background: big ? N.ink : N.paper, color: big ? cream : N.ink, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 64, right: 64, top: 44, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: N.dim }}>
        <span>// {String(idx).padStart(2, "0")} — {LABEL[slide.type]}</span>
        <span>citygym · 금호점 · {idx}/{total}</span>
      </div>
      {big ? <BigScene slide={slide} /> : <>
        <div style={{ position: "absolute", left: 64, right: 64, top: 104 }}><Headline text={slide.headline} /></div>
        {/* the reel's 720x620 middle stage, scaled up to fill the 4:5 frame */}
        <div style={{ position: "absolute", left: 44, top: 380, width: 720, height: 620, transform: "scale(1.32)", transformOrigin: "0 0" }}>
          {scene === "app" ? middle(slide, "금호점", idx - 1) : sceneMiddle(slide, scene)}
        </div>
        {plus(40, 380)}{plus(990, 380)}{plus(40, 1230)}
      </>}
      {!showsMascot && <div style={{ position: "absolute", right: big ? 0 : -30, bottom: big ? 20 : 0, width: big ? 470 : 240, height: big ? 564 : 288, filter: big ? "drop-shadow(4px 0 0 #F6EFE4) drop-shadow(-4px 0 0 #F6EFE4) drop-shadow(0 4px 0 #F6EFE4) drop-shadow(0 -4px 0 #F6EFE4)" : "none", transform: `translateY(${bob + (1 - pop) * 90}px) scale(${0.9 + 0.1 * pop})` }}><Mascot pose={POSE[slide.type]} /></div>}
      {slide.next && idx < total && (
        <div style={{ position: "absolute", left: 64, bottom: 56, fontFamily: SANS, fontSize: 46, fontWeight: 900, color: "#fff", background: N.ink, border: "3px solid #fff", borderRadius: 999, padding: "14px 34px", boxShadow: `5px 5px 0 ${N.accent}`, opacity: nextOn, transform: `translateX(${(1 - nextOn) * -20 + Math.sin(f / 6) * 5}px)` }}>
          {slide.next} →
        </div>
      )}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "100%", background: N.accent,
        transform: `translateX(${interpolate(f, [durationInFrames - 8, durationInFrames - 1], [-100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)` }} />
    </AbsoluteFill>
  );
};
