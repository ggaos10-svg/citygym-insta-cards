import React, { useId } from "react";
import { useCurrentFrame } from "remotion";

// Every illustration on the cards is drawn here in code (no image files): the CityGym mascot
// and isometric props, in the house style — thick ink outlines, flat
// warm fills, a flat blue offset shadow, paper grain and a line that "boils" 12 times a second.

export const INK = "#2A1A12";
export const WHITE = "#FFFDF7";
export const ORANGE = "#F0532A";
export const SHADOW = "#3B5BDB";
const TAU = Math.PI * 2;
const SW = 8; // outline width

// Hand-drawn look: wobbly outline (seed changes 12x/s) + fine grain on the fills.
export const Paper: React.FC<{ children: React.ReactNode; viewBox: string; style?: React.CSSProperties }> = ({ children, viewBox, style }) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox={viewBox} width="100%" height="100%" style={{ overflow: "visible", ...style }}>
      <defs>
        <filter id={`h${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={Math.floor(f / 2.5) % 40} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves={2} seed={3} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 0.42" result="ga" />
          <feComposite in="ga" in2="d" operator="in" result="grain" />
          <feMerge><feMergeNode in="d" /><feMergeNode in="grain" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#h${id})`}>{children}</g>
    </svg>
  );
};


export const Sweat: React.FC<{ x: number; y: number }> = ({ x, y }) =>
  <path d={`M${x} ${y - 34} q-20 30 0 42 q20 -12 0 -42z`} fill="#9FD3F5" stroke={INK} strokeWidth={5} />;

// ---------------------------------------------------------------- the mascot: 찹쌀떡 (mochi), front view

// A soft white rice cake with an orange sweatband, dot eyes, pink cheeks and thin ink limbs.
// It sits on the same flat blue offset shadow as the props so it stays visible on cream paper.
const MOCHI = "#FFF6E6", MOCHI_LO = "#EBD9BE", PINK = "#F59C98";
const LW = 13; // limb width
// body outline centred on (0, 0): 252 wide, 214 tall
const BODY = "M-126 60 Q-130 -90 0 -96 Q130 -90 126 60 Q126 116 0 118 Q-126 116 -126 60Z";

export type Pose = "wave" | "point" | "wow" | "thumbs" | "worried" | "cheer";
type Face = "smile" | "worried" | "wow" | "wink" | "joy" | "focus";
const FACE: Record<Pose, Face> = { wave: "smile", point: "smile", wow: "wow", thumbs: "wink", worried: "worried", cheer: "joy" };

export const Stick: React.FC<{ pts: number[][]; hand?: boolean; color?: string }> = ({ pts, hand, color = INK }) => {
  const end = pts[pts.length - 1];
  return <>
    <path d={"M" + pts.map((p) => p.join(" ")).join(" L")} stroke={color} strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {hand && <circle cx={end[0]} cy={end[1]} r={15} fill={color} />}
  </>;
};

// face centred on (0, 0); dx shifts it toward the front in side view
const MochiFace: React.FC<{ face: Face; blink?: boolean }> = ({ face, blink }) => {
  const g = 46, ink = { stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, fill: "none" };
  const dot = (x: number, r = 9) => blink
    ? <path d={`M${x - 9} 0 h18`} {...ink} />
    : <><circle cx={x} cy={0} r={r} fill={INK} /><circle cx={x + 3} cy={-3} r={r / 3} fill={WHITE} /></>;
  const arc = (x: number) => <path d={`M${x - 11} 4 Q${x} -10 ${x + 11} 4`} {...ink} />;
  const eyes = {
    smile: <>{dot(-g)}{dot(g)}</>,
    wow: <>{dot(-g, 12)}{dot(g, 12)}</>,
    worried: <>{dot(-g)}{dot(g)}<path d={`M${-g - 14} -26 L${-g + 8} -18 M${g + 14} -26 L${g - 8} -18`} {...ink} strokeWidth={5} /></>,
    wink: <>{dot(-g)}{arc(g)}</>,
    joy: <>{arc(-g)}{arc(g)}</>,
    focus: <><path d={`M${-g - 12} -2 L${-g + 10} 2 M${g + 12} -2 L${g - 10} 2`} {...ink} /></>,
  }[face];
  const mouth = {
    smile: <path d="M-13 14 q6.5 9 13 0 q6.5 9 13 0" {...ink} strokeWidth={5} />,
    wink: <path d="M-13 14 q6.5 9 13 0 q6.5 9 13 0" {...ink} strokeWidth={5} />,
    joy: <path d="M-15 12 Q0 34 15 12 Z" fill="#C2413B" stroke={INK} strokeWidth={5} strokeLinejoin="round" />,
    wow: <ellipse cx={0} cy={22} rx={9} ry={11} fill="#C2413B" stroke={INK} strokeWidth={5} />,
    worried: <path d="M-16 20 q4 -6 8 0 t8 0 t8 0 t8 0" {...ink} strokeWidth={4} />,
    focus: <path d="M-9 20 h18" {...ink} strokeWidth={5} />,
  }[face];
  return <>
    <ellipse cx={-g - 26} cy={22} rx={16} ry={9} fill={PINK} opacity={0.75} />
    <ellipse cx={g + 26} cy={22} rx={16} ry={9} fill={PINK} opacity={0.75} />
    {eyes}{mouth}
  </>;
};

// the body with band and face, centred on (0, 0); dx moves the face forward (side view)
const Mochi: React.FC<{ face: Face; blink?: boolean; dx?: number; t: number; shadow?: boolean }> = ({ face, blink, dx = 0, t, shadow = true }) => {
  const flap = 8 * Math.sin(t * TAU * 1.2);
  return <>
    {shadow && <path d={BODY} fill={SHADOW} transform="translate(-14 12)" />}
    <path d={BODY} fill={MOCHI} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M96 52 Q92 94 40 106" stroke={MOCHI_LO} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M-92 -62 Q-72 -82 -40 -86" stroke={WHITE} strokeWidth={10} strokeLinecap="round" fill="none" />
    <path d="M-123 -26 Q0 -60 123 -26 L121 4 Q0 -30 -121 4Z" fill={ORANGE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <g transform={`rotate(${flap} 118 -12)`}>
      <path d="M116 -16 l32 -20 l2 30 Z M116 -8 l34 12 l-16 22 Z" fill={ORANGE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
    <text x={-6} y={-17} textAnchor="middle" fontSize={17} fontWeight={900} fill={WHITE} fontFamily="Arial Black, Arial, sans-serif" letterSpacing={1}
      transform="rotate(0)">CITYGYM</text>
    <g transform={`translate(${dx} 42)`}><MochiFace face={face} blink={blink} /></g>
  </>;
};

export const Mascot: React.FC<{ pose: Pose }> = ({ pose }) => {
  const t = useCurrentFrame() / 30;
  const bob = Math.sin((t / 1.6) * TAU);
  const blink = t % 3.6 > 3.47;
  const y = 262, L = [82, y], R = [318, y];
  const w = 10 * Math.sin(t * TAU);
  let armL = [L, [52, y + 46], [48, y + 86]], armR = [R, [348, y + 46], [352, y + 86]];
  if (pose === "wave") armL = [L, [40, y - 40 + w], [36 + w, y - 100]];
  if (pose === "point") armL = [L, [44, y - 50], [40, y - 112]];
  if (pose === "cheer") { armL = [L, [40, y - 46], [28, y - 104 + w / 2]]; armR = [R, [360, y - 46], [372, y - 104 - w / 2]]; }
  if (pose === "wow") { armL = [L, [38, y - 6], [34, y - 56]]; armR = [R, [362, y - 6], [366, y - 56]]; }
  if (pose === "thumbs") armR = [R, [362, y + 20], [366, y - 26]];
  if (pose === "worried") armR = [R, [358, y - 50], [328, y - 112]];
  const end = (a: number[][]) => a[a.length - 1];
  // squash and stretch on the bob: mochi is soft
  return (
    <Paper viewBox="0 0 400 480">
      <ellipse cx={200} cy={450} rx={110} ry={12} fill="#00000018" />
      <g transform={`translate(0 ${-5 * bob})`}>
        <Stick pts={[[172, 340], [168, 428]]} /><Stick pts={[[228, 340], [232, 428]]} />
        <ellipse cx={158} cy={434} rx={26} ry={12} fill={INK} /><ellipse cx={242} cy={434} rx={26} ry={12} fill={INK} />
        <g transform={`translate(200 236) translate(0 118) scale(${1 + 0.025 * bob} ${1 - 0.025 * bob}) translate(0 -118)`}>
          <Mochi face={FACE[pose]} blink={blink} t={t} />
        </g>
        <Stick pts={armL} hand /><Stick pts={armR} hand />
        {pose === "point" && <Stick pts={[end(armL), [end(armL)[0] + 2, end(armL)[1] - 34]]} />}
        {pose === "thumbs" && <rect x={end(armR)[0] - 7} y={end(armR)[1] - 44} width={15} height={36} rx={7.5} fill={INK} />}
        {pose === "worried" && <Sweat x={70} y={150} />}
        {pose === "wow" && [0, 1, 2].map((i) => <path key={i} d={`M${200 + (i - 1) * 60} ${118 - (i === 1 ? 10 : 0)} l${(i - 1) * 10} -26`} stroke={INK} strokeWidth={7} strokeLinecap="round" />)}
      </g>
    </Paper>
  );
};

// ---------------------------------------------------------------- the mascot from the side (exercise demos)

type SideSpec = { shin: number; thigh: number; torso: number; heel?: number; expr: Face };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Facing right; ankle at (190, 416). Degrees: shin forward from vertical, thigh back from
// vertical, torso forward lean. The body is drawn small and the stick legs on top of it, so the
// knee and hip angles always read.
const SideBody: React.FC<{ s: SideSpec; extra?: React.ReactNode; sweat?: boolean }> = ({ s, extra, sweat }) => {
  const t = useCurrentFrame() / 30;
  const r = (d: number) => (d * Math.PI) / 180;
  const ax = 190, ay = 430, L1 = 104, L2 = 104;
  const heel = s.heel ?? 0;
  const ankle = [ax, ay - 14 - heel * 0.9];
  const knee = [ankle[0] + L1 * Math.sin(r(s.shin)), ankle[1] - L1 * Math.cos(r(s.shin))];
  const hip = [knee[0] - L2 * Math.sin(r(s.thigh)), knee[1] - L2 * Math.cos(r(s.thigh))];
  const up = [Math.sin(r(s.torso)), -Math.cos(r(s.torso))];
  // the body sits on the hips (leaning with the torso) so the thigh stays visible below it
  const c = [hip[0] + up[0] * 24, hip[1] - 80];
  const sh = [c[0] + 80, c[1] + 48];
  return (
    <>
      <ellipse cx={ax + 6} cy={ay + 8} rx={92} ry={16} fill={SHADOW} />
      {/* far leg, a step behind and lighter, so standing reads as two legs */}
      <g transform="translate(-16 -4)" opacity={0.55}>
        <g transform={`rotate(${heel} ${ax + 40} ${ay})`}><ellipse cx={ax + 16} cy={ay - 8} rx={30} ry={13} fill={INK} /></g>
        <Stick pts={[hip, knee, ankle]} />
      </g>
      <g transform={`rotate(${heel} ${ax + 40} ${ay})`}><ellipse cx={ax + 16} cy={ay - 8} rx={30} ry={13} fill={INK} /></g>
      <g transform={`translate(${c[0]} ${c[1]}) rotate(${s.torso * 0.5}) scale(0.7)`}><Mochi face={s.expr} dx={44} t={t} shadow={false} /></g>
      <Stick pts={[hip, knee, ankle]} />
      <circle cx={hip[0]} cy={hip[1]} r={9} fill={INK} />
      <Stick pts={[sh, [sh[0] + 42, sh[1] + 4], [sh[0] + 84, sh[1] - 4]]} hand />
      {sweat && <Sweat x={c[0] - 60} y={c[1] - 74} />}
      {extra}
    </>
  );
};

const STAND: SideSpec = { shin: 0, thigh: 0, torso: 0, expr: "smile" };
const mix = (a: SideSpec, b: SideSpec, k: number): SideSpec => ({
  shin: lerp(a.shin, b.shin, k), thigh: lerp(a.thigh, b.thigh, k), torso: lerp(a.torso, b.torso, k),
  heel: lerp(a.heel ?? 0, b.heel ?? 0, k), expr: b.expr,
});

export type SidePose = "squat_bad" | "squat_good" | "squat_parallel" | "squat_heels" | "chair";

export const MascotSide: React.FC<{ pose: SidePose }> = ({ pose }) => {
  const t = useCurrentFrame() / 30;
  const cycle = 0.5 + 0.5 * Math.cos((t / 2) * TAU); // 1 = bottom at 0, 2, 4 s (the cover frame), standing in between
  const k = Math.min(1, cycle * 1.6);
  const vb = "20 40 390 430";
  if (pose === "squat_bad") return <Paper viewBox={vb}><SideBody s={mix(STAND, { shin: 50, thigh: 60, torso: 4, heel: 16, expr: "worried" }, k)} sweat /></Paper>;
  if (pose === "squat_good") return <Paper viewBox={vb}><SideBody s={mix(STAND, { shin: 20, thigh: 96, torso: 40, expr: "joy" }, k)} /></Paper>;
  if (pose === "squat_parallel") {
    const ky = 416 - 104 * Math.cos((24 * Math.PI) / 180), kx = 190 + 104 * Math.sin((24 * Math.PI) / 180);
    return <Paper viewBox={vb}><SideBody s={{ shin: 24, thigh: 90, torso: 42, expr: "focus" }} extra={<path d={`M${kx - 170} ${ky} L${kx + 60} ${ky}`} stroke={ORANGE} strokeWidth={6} strokeDasharray="14 10" />} /></Paper>;
  }
  if (pose === "squat_heels") {
    const glow = 0.5 + 0.5 * Math.sin(t * TAU * 2);
    return <Paper viewBox={vb}><SideBody s={mix({ ...STAND, expr: "joy" }, { shin: 20, thigh: 96, torso: 40, expr: "focus" }, k)}
      extra={<>{[0, 1].map((i) => <ellipse key={i} cx={180} cy={434} rx={30 + i * 18 + glow * 6} ry={9 + i * 5} fill="none" stroke={ORANGE} strokeWidth={5} opacity={1 - i * 0.4} />)}
        <path d="M128 412 l-18 -10 M126 430 l-22 0 M236 412 l18 -10" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" /></>} /></Paper>;
  }
  // chair: sit back onto the seat and stand up again (seat top at the hip's lowest point)
  const chair = <g>
    <rect x={14} y={190} width={20} height={246} rx={6} fill="#B66A33" stroke={INK} strokeWidth={6} />
    <rect x={14} y={326} width={140} height={20} rx={6} fill="#C77A3E" stroke={INK} strokeWidth={6} />
    <rect x={134} y={336} width={16} height={100} rx={6} fill="#B66A33" stroke={INK} strokeWidth={6} />
    <rect x={20} y={336} width={16} height={100} rx={6} fill="#B66A33" stroke={INK} strokeWidth={6} />
  </g>;
  return <Paper viewBox={vb}>{chair}<SideBody s={mix(STAND, { shin: 6, thigh: 92, torso: 16, expr: "smile" }, k)} /></Paper>;
};

// ---------------------------------------------------------------- isometric props

const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
// iso point: x runs down-right, y runs down-left, z up
const P = (ox: number, oy: number) => (x: number, y: number, z: number) => [ox + (x - y) * C30, oy + (x + y) * S30 - z];
const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");
const Poly: React.FC<{ pts: number[][]; fill: string; sw?: number }> = ({ pts, fill, sw = 6 }) =>
  <polygon points={poly(pts)} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
// a box: left face (y = d), right face (x = w), top
const Box: React.FC<{ p: ReturnType<typeof P>; x?: number; y?: number; z?: number; w: number; d: number; h: number; top: string; left: string; right: string }> = ({ p, x = 0, y = 0, z = 0, w, d, h, top, left, right }) => <>
  <Poly pts={[p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)]} fill={left} />
  <Poly pts={[p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)]} fill={right} />
  <Poly pts={[p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)]} fill={top} />
</>;
// SVG matrix that maps a face's local (u, v-down) coordinates onto the left (y = d) face
const leftFace = (p: ReturnType<typeof P>, d: number, h: number) => { const o = p(0, d, h); return `matrix(${C30} ${S30} 0 1 ${o[0]} ${o[1]})`; };

export const Clipboard: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const tick = (i: number) => Math.min(1, Math.max(0, (t - 0.4 - i * 0.25) * 4));
  return (
    <Paper viewBox="0 0 400 460">
      <g transform="rotate(-9 200 240)">
        <rect x={58} y={92} width={290} height={350} rx={26} fill={SHADOW} transform="translate(-34 22)" />
        <rect x={58} y={92} width={290} height={350} rx={26} fill="#D9672F" stroke={INK} strokeWidth={SW} />
        <rect x={82} y={120} width={242} height={300} rx={12} fill="#FBF3E4" stroke={INK} strokeWidth={6} />
        <rect x={150} y={70} width={106} height={56} rx={14} fill="#55524E" stroke={INK} strokeWidth={SW} />
        <circle cx={203} cy={84} r={9} fill={INK} />
        {[0, 1, 2].map((i) => {
          const y = 168 + i * 84;
          return <g key={i}>
            <rect x={106} y={y} width={44} height={44} rx={6} fill={WHITE} stroke={INK} strokeWidth={6} />
            <path d={`M${112} ${y + 22} l14 14 l26 -34`} stroke={ORANGE} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="70" strokeDashoffset={70 * (1 - tick(i))} />
            <path d={`M170 ${y + 12} h120 M170 ${y + 34} h84`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          </g>;
        })}
      </g>
    </Paper>
  );
};

export const Building: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const p = P(210, 170);
  const W = 170, D = 120, H = 250;
  const lit = (i: number) => (Math.floor(t * 1.5 + i * 7) % 5 === 0 ? "#FFE08A" : "#7FC7D9");
  const L = leftFace(p, D, 0);
  return (
    <Paper viewBox="0 0 400 470">
      <polygon points={poly([p(0, 0, 0), p(W, 0, 0), p(W, D, 0), p(0, D, 0)])} fill={SHADOW} transform="translate(-22 14)" />
      <Box p={p} w={W} d={D} h={H} top="#4E4B52" left="#E06B3C" right="#B4502A" />
      <Box p={p} x={18} y={14} z={H} w={60} d={44} h={26} top="#77737A" left="#D0CCC4" right="#A9A59D" />
      {/* windows and sign drawn in the left face's own plane */}
      <g transform={L}>
        <rect x={0} y={-H} width={W} height={46} fill="#F5C33B" stroke={INK} strokeWidth={6} />
        <text x={W / 2} y={-H + 34} textAnchor="middle" fontSize={30} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial, sans-serif">CITYGYM</text>
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 52} y={-H + 66 + r * 52} width={36} height={34} fill={lit(r * 3 + c)} stroke={INK} strokeWidth={5} />))}
        <rect x={52} y={-62} width={66} height={62} fill="#2E6F73" stroke={INK} strokeWidth={6} />
        <path d="M85 -62 V0" stroke={INK} strokeWidth={5} />
      </g>
    </Paper>
  );
};

export const Subway: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const p = P(176, 170);
  const W = 190, D = 130, G = 26; // slab size, slab height
  const steps = 6;
  return (
    <Paper viewBox="0 0 400 420">
      <polygon points={poly([p(0, 0, 0), p(W, 0, 0), p(W, D, 0), p(0, D, 0)])} fill={SHADOW} transform="translate(-18 12)" />
      <Box p={p} w={W} d={D} h={G} top="#D8CFC0" left="#C9632F" right="#A74F26" />
      {/* stairwell opening with steps going down */}
      <Poly pts={[p(26, 22, G), p(W - 20, 22, G), p(W - 20, D - 26, G), p(26, D - 26, G)]} fill="#3A3633" />
      {Array.from({ length: steps }, (_, i) => {
        const x0 = 30 + i * 22;
        return <Poly key={i} sw={4} pts={[p(x0, 26, G - 4 - i * 8), p(x0 + 22, 26, G - 4 - i * 8), p(x0 + 22, D - 30, G - 4 - i * 8), p(x0, D - 30, G - 4 - i * 8)]} fill={i % 2 ? "#C8BFB0" : "#B5AC9D"} />;
      })}
      {/* green railings on the two far sides */}
      {[[[26, 22], [W - 20, 22]], [[26, 22], [26, D - 26]]].map((seg, si) => {
        const [a, b] = seg;
        const posts = Array.from({ length: 7 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6]);
        return <g key={si}>
          {posts.map(([x, y], i) => <path key={i} d={`M${p(x, y, G).join(" ")} L${p(x, y, G + 52).join(" ")}`} stroke="#2F5D3A" strokeWidth={7} />)}
          <path d={`M${p(a[0], a[1], G + 52).join(" ")} L${p(b[0], b[1], G + 52).join(" ")}`} stroke="#2F5D3A" strokeWidth={11} strokeLinecap="round" />
          <path d={`M${p(a[0], a[1], G + 52).join(" ")} L${p(b[0], b[1], G + 52).join(" ")}`} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        </g>;
      })}
      {/* sign post with a pulsing line-1 badge */}
      <path d={`M${p(W - 6, 8, G).join(" ")} L${p(W - 6, 8, G + 210).join(" ")}`} stroke="#2F5D3A" strokeWidth={12} strokeLinecap="round" />
      <rect x={p(W - 6, 8, G + 236)[0] - 24} y={p(W - 6, 8, G + 236)[1]} width={48} height={56} rx={8} fill="#2F5D3A" stroke={INK} strokeWidth={6} />
      <circle cx={p(W - 6, 8, G + 236)[0]} cy={p(W - 6, 8, G + 236)[1] + 28} r={16 + 1.5 * Math.sin(t * TAU)} fill={WHITE} stroke={INK} strokeWidth={4} />
      <text x={p(W - 6, 8, G + 236)[0]} y={p(W - 6, 8, G + 236)[1] + 38} textAnchor="middle" fontSize={26} fontWeight={900} fill="#2F5D3A" fontFamily="Arial Black, Arial, sans-serif">1</text>
    </Paper>
  );
};

// ---------------------------------------------------------------- gym equipment (isometric)

// face colours [top, left, right]: light from the top left
type Shade = [string, string, string];
const ORG: Shade = ["#FF8A5B", "#F0532A", "#B83A1B"];
const DARK: Shade = ["#5A5650", "#3A3633", "#262320"];
const WOOD: Shade = ["#E8B477", "#C98A4B", "#9C642F"];
const CRM: Shade = ["#FFF6E6", "#EADBC2", "#CDBB9F"];
const METAL: Shade = ["#ECE6DC", "#BDB6AA", "#938C80"];
type Pt = ReturnType<typeof P>;
const B: React.FC<{ p: Pt; at: number[]; size: number[]; c: Shade }> = ({ p, at, size, c }) =>
  <Box p={p} x={at[0]} y={at[1]} z={at[2]} w={size[0]} d={size[1]} h={size[2]} top={c[0]} left={c[1]} right={c[2]} />;
// a P() whose W x D x H block sits centred in a 400 x 420 view
const fit = (W: number, D: number, H: number) => P(200 - ((W - D) / 2) * C30, (420 - ((W + D) / 2 + H)) / 2 + H);
const Ground: React.FC<{ p: Pt; W: number; D: number }> = ({ p, W, D }) =>
  <polygon points={poly([p(0, 0, 0), p(W, 0, 0), p(W, D, 0), p(0, D, 0)])} fill={SHADOW} transform="translate(-20 13)" />;
const Line: React.FC<{ a: number[]; b: number[]; c?: string; w?: number }> = ({ a, b, c = INK, w = 6 }) =>
  <path d={`M${a.join(" ")} L${b.join(" ")}`} stroke={c} strokeWidth={w} strokeLinecap="round" />;
// matrices that draw flat 2D shapes onto iso planes: the floor/top (z), a y = const wall, an x = const wall
const onTop = (p: Pt, z: number) => { const o = p(0, 0, z); return `matrix(${C30} ${S30} ${-C30} ${S30} ${o[0]} ${o[1]})`; };
const onY = (p: Pt, x: number, y: number, z: number) => { const o = p(x, y, z); return `matrix(${C30} ${S30} 0 1 ${o[0]} ${o[1]})`; };
const onX = (p: Pt, x: number, y: number, z: number) => { const o = p(x, y, z); return `matrix(${-C30} ${S30} 0 1 ${o[0]} ${o[1]})`; };
// a weight plate standing in an x = const plane
const Plate: React.FC<{ p: Pt; x: number; y: number; z: number; r: number }> = ({ p, x, y, z, r }) =>
  <g transform={onX(p, x, y, z)}><circle r={r} fill="#2E2B28" stroke={INK} strokeWidth={6} /><circle r={r * 0.3} fill="#77726B" stroke={INK} strokeWidth={4} /></g>;

// cable crossover: two weight-stack towers, a top beam and two swinging handles
export const Machines: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 250, D = 44, H = 250, p = fit(W, D, H);
  const swing = 6 * Math.sin(t * TAU * 0.6);
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      {[0, W - 36].map((x) => <React.Fragment key={x}>
        <B p={p} at={[x - 6, -6, 0]} size={[48, 56, 14]} c={DARK} />
        <B p={p} at={[x, 0, 14]} size={[36, 44, H - 30]} c={ORG} />
        <g transform={onY(p, x, 44, 14)}>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={7} y={-(i + 1) * 16} width={22} height={13} fill="#2E2B28" stroke={INK} strokeWidth={3} />)}</g>
      </React.Fragment>)}
      <B p={p} at={[0, 8, H - 16]} size={[W, 28, 22]} c={ORG} />
      {[40, W - 40].map((x, i) => {
        const top = p(x, 40, H - 40), hand = p(x + (i ? -30 : 30) + swing, 52, 120);
        return <g key={x}>
          <Line a={top} b={hand} c="#55524E" w={4} />
          <circle cx={top[0]} cy={top[1]} r={9} fill={METAL[1]} stroke={INK} strokeWidth={4} />
          <path d={`M${hand[0] - 14} ${hand[1]} q14 26 28 0 z`} fill={ORANGE} stroke={INK} strokeWidth={5} />
        </g>;
      })}
    </Paper>
  );
};

// stair climber (천국의계단): dark housing, steps rising to the back, orange side panel, rails
export const Stairs: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 210, D = 120, H = 270, p = fit(W, D, H);
  const n = 6, run = 30, rise = 30, shift = (t * 0.8) % 1; // steps creep down like the real machine
  const sideP = (y: number) => [p(0, y, 0), p(W, y, 0), p(W, y, 46), p(36, y, 250), p(0, y, 250)];
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      <Poly pts={sideP(0)} fill={ORG[2]} />
      {Array.from({ length: n }, (_, k) => n - 1 - k).map((i) => {
        const x = W - 20 - (i + 1) * run, z = 40 + i * rise - shift * 6;
        return <B key={i} p={p} at={[x, 14, 0]} size={[run, D - 28, z]} c={DARK} />;
      })}
      <Poly pts={sideP(D)} fill={ORG[1]} />
      <g transform={onY(p, 0, D, 0)}><path d="M40 -40 L180 -40 M30 -120 L120 -120" stroke={ORG[2]} strokeWidth={10} strokeLinecap="round" /></g>
      {[0, D].map((y) => <Line key={y} a={p(W - 50, y, 150)} b={p(10, y, 290)} c={METAL[2]} w={10} />)}
      <B p={p} at={[-4, 30, 270]} size={[24, 60, 36]} c={DARK} />
      <g transform={onY(p, -4, 90, 270)}><rect x={3} y={-30} width={18} height={22} fill="#7FC7D9" stroke={INK} strokeWidth={3} /></g>
    </Paper>
  );
};

// hip thrust machine (부티빌더): back pad, hip roller with plates, foot plate
export const Booty: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 230, D = 130, H = 170, p = fit(W, D, H);
  const lift = 14 * (0.5 - 0.5 * Math.cos(t * TAU * 0.5)); // the roller rises and falls
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      <B p={p} at={[0, 0, 0]} size={[W, D, 18]} c={DARK} />
      <Plate p={p} x={130} y={-22} z={120 + lift} r={42} />
      <B p={p} at={[100, -4, 18]} size={[16, 14, 90 + lift]} c={ORG} />
      <B p={p} at={[10, 14, 18]} size={[50, D - 28, 70]} c={DARK} />
      <B p={p} at={[0, 8, 88]} size={[78, D - 16, 26]} c={["#6A655E", "#46423D", "#2E2B28"]} />
      <B p={p} at={[150, 20, 18]} size={[64, D - 40, 12]} c={METAL} />
      <B p={p} at={[118, -14, 108 + lift]} size={[26, D + 28, 24]} c={DARK} />
      <B p={p} at={[100, D - 10, 18]} size={[16, 14, 90 + lift]} c={ORG} />
      <Plate p={p} x={130} y={D + 22} z={120 + lift} r={42} />
    </Paper>
  );
};

// flat bench in front of a squat rack with a loaded barbell
export const Bench: React.FC = () => {
  const W = 230, D = 150, H = 230, p = fit(W, D, H);
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      {[0, D - 18].map((y) => <B key={y} p={p} at={[0, y, 0]} size={[18, 18, H - 10]} c={CRM} />)}
      <Line a={p(9, -50, 190)} b={p(9, D + 50, 190)} c={METAL[2]} w={9} />
      <Plate p={p} x={9} y={-30} z={190} r={46} />
      <Plate p={p} x={9} y={D + 30} z={190} r={46} />
      {[60, 190].map((x) => <B key={x} p={p} at={[x, D / 2 - 18, 0]} size={[14, 36, 54]} c={CRM} />)}
      <B p={p} at={[40, D / 2 - 30, 54]} size={[180, 60, 20]} c={ORG} />
    </Paper>
  );
};

// half-body sauna (반신욕기): wooden cabinet, head hole on top, steam
export const Sauna: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 150, D = 150, H = 210, p = fit(W, D, H);
  const hole = p(W / 2, D / 2, H);
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      <B p={p} at={[0, 0, 0]} size={[W, D, H]} c={WOOD} />
      <g transform={onY(p, 0, D, 0)}>{[30, 60, 90, 120].map((u) => <path key={u} d={`M${u} -6 V${-H + 6}`} stroke={WOOD[2]} strokeWidth={4} />)}
        <rect x={60} y={-120} width={30} height={10} rx={5} fill={WOOD[2]} stroke={INK} strokeWidth={3} /></g>
      <g transform={onX(p, W, 0, 0)}>{[0, 1, 2, 3].map((i) => <path key={i} d={`M${48 + i * 14} -150 V-110`} stroke={INK} strokeWidth={5} />)}</g>
      <g transform={onTop(p, H)}><circle cx={W / 2} cy={D / 2} r={36} fill="#3A3633" stroke={INK} strokeWidth={5} /><circle cx={W / 2} cy={D / 2} r={20} fill="#1E1B19" /></g>
      {[-22, 0, 22].map((dx, i) => {
        const k = (t * 0.7 + i / 3) % 1;
        return <path key={i} d={`M${hole[0] + dx} ${hole[1] - 20 - k * 70} q-10 -12 0 -24 q10 -12 0 -24`} stroke="#D9D2C6" strokeWidth={7} fill="none" strokeLinecap="round" opacity={1 - k} />;
      })}
    </Paper>
  );
};

// reception desk (상담 데스크): counter with logo, monitor, plant, towels
export const Desk: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 240, D = 100, H = 200, p = fit(W, D, H);
  const blink = Math.floor(t * 2) % 2 ? "#7FC7D9" : "#A8DDEA";
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      <B p={p} at={[0, 0, 0]} size={[W, D, 110]} c={["#FFF6E6", ORANGE, "#B83A1B"]} />
      <g transform={onY(p, 0, D, 0)}>
        <rect x={70} y={-70} width={100} height={30} rx={6} fill={INK} />
        <path d="M84 -55 h72" stroke={WHITE} strokeWidth={8} strokeLinecap="round" />
        {[84, 156].map((x) => <rect key={x} x={x - 8} y={-66} width={16} height={22} rx={4} fill={WHITE} />)}
      </g>
      <B p={p} at={[30, 10, 110]} size={[50, 50, 22]} c={DARK} />
      {[0, 1, 2].map((i) => <B key={i} p={p} at={[150, 20, 110 + i * 14]} size={[56, 40, 14]} c={i % 2 ? ["#FFFFFF", "#E5E0D8", "#C9C3B8"] : ["#BFE0FF", "#8DBBE6", "#6A97C2"]} />)}
      <B p={p} at={[70, 30, 110]} size={[14, 30, 40]} c={DARK} />
      <B p={p} at={[62, 10, 150]} size={[10, 70, 56]} c={DARK} />
      <g transform={onX(p, 72, 10, 150)}><rect x={4} y={-50} width={62} height={44} fill={blink} stroke={INK} strokeWidth={3} /></g>
      <circle cx={p(40, 34, 160)[0]} cy={p(40, 34, 160)[1]} r={26} fill="#4F9D5A" stroke={INK} strokeWidth={5} />
      <circle cx={p(40, 34, 160)[0] - 18} cy={p(40, 34, 160)[1] + 10} r={16} fill="#3D8448" stroke={INK} strokeWidth={4} />
    </Paper>
  );
};

// dumbbell rack: orange A-frame, two tiers of hex dumbbells
export const Rack: React.FC = () => {
  const W = 230, D = 130, H = 150, p = fit(W, D, H);
  // one dumbbell lying across the tray (along y): head, handle, head
  const bell = (x: number, y: number, z: number) => <React.Fragment key={`${x}${z}`}>
    <B p={p} at={[x, y, z]} size={[26, 22, 26]} c={DARK} />
    <Line a={p(x + 13, y + 22, z + 13)} b={p(x + 13, y + 58, z + 13)} c={METAL[2]} w={8} />
    <B p={p} at={[x, y + 58, z]} size={[26, 22, 26]} c={DARK} />
  </React.Fragment>;
  const end = (x: number) => <Poly pts={[p(x, 0, 0), p(x, 0, H), p(x, 86, H), p(x, 86, 84), p(x, D, 84), p(x, D, 0)]} fill={ORG[2]} />;
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      {end(0)}
      <B p={p} at={[0, 0, 112]} size={[W, 86, 8]} c={ORG} />
      {[0, 1, 2, 3, 4].map((i) => bell(16 + i * 42, 3, 120))}
      <B p={p} at={[0, 44, 46]} size={[W, 86, 8]} c={ORG} />
      {[0, 1, 2, 3, 4].map((i) => bell(16 + i * 42, 47, 54))}
      {end(W)}
    </Paper>
  );
};

// treadmill: dark deck with a moving belt, side rails, console at the far end
export const Treadmill: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 250, D = 110, H = 190, p = fit(W, D, H);
  const run = (t * 60) % 40;
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      {[12, D - 22].map((y) => <B key={y} p={p} at={[8, y, 0]} size={[12, 10, 150]} c={METAL} />)}
      <B p={p} at={[-6, 0, 150]} size={[34, D, 34]} c={ORG} />
      <g transform={onY(p, -6, D, 150)}><rect x={6} y={-28} width={22} height={18} fill="#7FC7D9" stroke={INK} strokeWidth={3} /></g>
      <B p={p} at={[20, 0, 0]} size={[W - 20, D, 28]} c={DARK} />
      <g transform={onTop(p, 28)}>
        <rect x={30} y={14} width={W - 44} height={D - 28} fill="#2A2724" stroke={INK} strokeWidth={4} />
        {Array.from({ length: 6 }, (_, i) => 34 + i * 40 + run).filter((x) => x < W - 16).map((x) => <path key={x} d={`M${x} 18 V${D - 18}`} stroke="#4A4642" strokeWidth={6} />)}
      </g>
      {[6, D - 6].map((y) => <Line key={y} a={p(20, y, 120)} b={p(110, y, 90)} c={METAL[2]} w={9} />)}
    </Paper>
  );
};

// phone lying flat, booking calendar on screen with today's cell pulsing
export const Phone: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const W = 150, D = 270, H = 16, p = fit(W, D, H + 200);
  const pulse = 0.6 + 0.4 * Math.sin(t * TAU);
  return (
    <Paper viewBox="0 0 400 420">
      <Ground p={p} W={W} D={D} />
      <B p={p} at={[0, 0, 0]} size={[W, D, H]} c={DARK} />
      <g transform={onTop(p, H)}>
        <rect x={10} y={12} width={W - 20} height={D - 24} rx={14} fill="#FBF3E4" stroke={INK} strokeWidth={4} />
        <rect x={10} y={12} width={W - 20} height={44} rx={10} fill={ORANGE} stroke={INK} strokeWidth={4} />
        {Array.from({ length: 30 }, (_, i) => {
          const c = i % 5, r = Math.floor(i / 5), today = i === 17;
          return <rect key={i} x={20 + c * 23} y={70 + r * 30} width={18} height={22} rx={4} fill={today ? ORANGE : "#E3D8C6"} opacity={today ? pulse : 1} stroke={today ? INK : "none"} strokeWidth={3} />;
        })}
      </g>
    </Paper>
  );
};

// stopwatch seen from the front, hand sweeping
export const Stopwatch: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const a = (t / 8) * 360 * 2;
  return (
    <Paper viewBox="0 0 400 420">
      <circle cx={180} cy={250} r={140} fill={SHADOW} />
      <rect x={176} y={46} width={48} height={40} rx={8} fill="#55524E" stroke={INK} strokeWidth={SW} />
      <circle cx={200} cy={40} r={22} fill="none" stroke={INK} strokeWidth={14} />
      <rect x={300} y={92} width={34} height={26} rx={6} fill="#55524E" stroke={INK} strokeWidth={6} transform="rotate(45 317 105)" />
      <circle cx={200} cy={236} r={140} fill={ORANGE} stroke={INK} strokeWidth={SW} />
      <circle cx={200} cy={236} r={112} fill="#FBF3E4" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d="M200 134 v18" stroke={INK} strokeWidth={i % 3 ? 4 : 8} strokeLinecap="round" transform={`rotate(${i * 30} 200 236)`} />)}
      <path d="M200 236 v-90" stroke="#C2413B" strokeWidth={8} strokeLinecap="round" transform={`rotate(${a} 200 236)`} />
      <circle cx={200} cy={236} r={12} fill={INK} />
    </Paper>
  );
};

// squat stance on a mat: feet shoulder-width, toes out 15° (the frame inside the mat is turned
// -45° so "forward" points up the screen)
export const FeetStance: React.FC = () => {
  const sole = "M-46 -40 C-50 -110 -38 -160 0 -168 C38 -160 50 -110 46 -40 C44 0 26 18 0 18 C-26 18 -44 0 -46 -40Z";
  const foot = (x: number, deg: number) => <g transform={`translate(${x} 110) rotate(${deg}) scale(1.45)`}>
    <path d={sole} transform="translate(0 14)" fill="#14110F" stroke={INK} strokeWidth={7} vectorEffect="non-scaling-stroke" />
    <path d={sole} fill="#3A3633" stroke={INK} strokeWidth={7} vectorEffect="non-scaling-stroke" />
    <path d="M-20 -120 Q0 -136 20 -120" stroke="#77726B" strokeWidth={6} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </g>;
  const iso = (x: number, y: number) => `translate(${x} ${y}) matrix(0.866 0.5 -0.866 0.5 0 0)`;
  const mat = (fill: string) => <rect x={-330} y={-230} width={660} height={460} rx={40} fill={fill} stroke={INK} strokeWidth={7} vectorEffect="non-scaling-stroke" />;
  return (
    <Paper viewBox="0 0 1024 1024">
      <g transform={iso(552, 610)}><rect x={-330} y={-230} width={660} height={460} rx={40} fill={SHADOW} /></g>
      <g transform={iso(512, 592)}>{mat("#8C3A22")}</g>
      <g transform={iso(512, 570)}>
        {mat(ORANGE)}
        <rect x={-300} y={-200} width={600} height={400} rx={26} fill="#FFFDF8" stroke={INK} strokeWidth={4} vectorEffect="non-scaling-stroke" />
        <g transform="rotate(-45)">
          <path d="M-150 110 L-150 -230 M150 110 L150 -230" stroke="#B9AFA0" strokeWidth={4} strokeDasharray="14 12" vectorEffect="non-scaling-stroke" />
          <path d="M-150 110 L-238 -218 M150 110 L238 -218" stroke={ORANGE} strokeWidth={5} strokeDasharray="16 10" vectorEffect="non-scaling-stroke" />
          {foot(-150, -15)}{foot(150, 15)}
          <path d="M-150 185 L150 185 M-150 168 L-150 202 M150 168 L150 202" stroke={INK} strokeWidth={6} vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <g fontFamily="Arial Black, Arial, sans-serif" fontWeight={900}>
        {[196, 710].map((x) => <React.Fragment key={x}>
          <rect x={x} y={352} width={118} height={60} rx={30} fill={INK} />
          <text x={x + 59} y={394} textAnchor="middle" fontSize={33} fill={WHITE}>15°</text>
        </React.Fragment>)}
      </g>
    </Paper>
  );
};

// name -> drawing. Every `prop` / `left_prop` a post may use must be listed here
// (cards/render.py reads these keys for the checker).
export const CODE_PROPS: Record<string, React.FC> = {
  squat_bad: () => <MascotSide pose="squat_bad" />,
  squat_good: () => <MascotSide pose="squat_good" />,
  squat_parallel: () => <MascotSide pose="squat_parallel" />,
  squat_heels: () => <MascotSide pose="squat_heels" />,
  chair: () => <MascotSide pose="chair" />,
  feet_stance: FeetStance,
  machines: Machines,
  stairs: Stairs,
  treadmill: Treadmill,
  booty: Booty,
  bench: Bench,
  sauna: Sauna,
  desk: Desk,
  rack: Rack,
  phone: Phone,
  stopwatch: Stopwatch,
  board: Clipboard,
  building: Building,
  subway: Subway,
};
