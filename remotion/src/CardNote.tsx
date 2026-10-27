import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LABEL, MONO, N, NoteScene, POSE, middle } from "./note/note";
import { Mascot } from "./art/Art";
import { parse } from "./note/common";
import { SANS, enter, slam } from "./note/pulse";

// Card-news slide in the blog's "Note" look (cream paper, mono header, bold headline writing
// itself word by word, app-window card with an isometric prop, the CityGym mascot reacting),
// re-laid out for a 1080x1350 Instagram carousel slide.
export type CardSlide = NoteScene & { headline: string; next?: string };
export type CardProps = { slide: CardSlide; idx: number; total: number };

// Headline: 100px, one line per "\n" in the copy (the checker keeps each line short enough to fit),
// written a word at a time.
const Headline: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  let i = 0;
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 100, lineHeight: 1.18, letterSpacing: -2.5, wordBreak: "keep-all" }}>
      {parse(text).flatMap((part, pi) =>
        part.text.split(/(\n|\s+)/).filter(Boolean).map((w, wi) => {
          if (w === "\n") return <br key={`${pi}-${wi}`} />;
          if (!w.trim()) return <span key={`${pi}-${wi}`}> </span>;
          const on = enter(f, 6 + i++ * 3, 5); // a word every 0.1 s, like the narration-timed reel
          const key = part.hl || part.red;
          return (
            <span key={`${pi}-${wi}`} style={{
              display: "inline-block", opacity: on, transform: `translateY(${(1 - on) * 14}px)`,
              color: key ? N.accent : N.ink, textDecoration: key ? "underline" : "none", textUnderlineOffset: 14, textDecorationThickness: 8,
            }}>{w}</span>
          );
        }),
      )}
    </div>
  );
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
  return (
    <AbsoluteFill style={{ background: N.paper, color: N.ink, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: 64, right: 64, top: 44, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, color: N.dim }}>
        <span>// {String(idx).padStart(2, "0")} — {LABEL[slide.type]}</span>
        <span>citygym · 금호점 · {idx}/{total}</span>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: 104 }}><Headline text={slide.headline} /></div>
      {/* the reel's 720x620 middle stage, scaled up to fill the 4:5 frame */}
      <div style={{ position: "absolute", left: 44, top: 380, width: 720, height: 620, transform: "scale(1.32)", transformOrigin: "0 0" }}>
        {middle(slide, "금호점", idx - 1)}
      </div>
      {plus(40, 380)}{plus(990, 380)}{plus(40, 1230)}
      {!showsMascot && <div style={{ position: "absolute", right: -30, bottom: 0, width: 240, height: 288, transform: `translateY(${bob + (1 - pop) * 90}px) scale(${0.9 + 0.1 * pop})` }}><Mascot pose={POSE[slide.type]} /></div>}
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
