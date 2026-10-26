// Render every slide of a post JSON with Remotion: NN.mp4 (8 s) + NN.jpg (still at 4 s, the cover frame).
// Note posts render one Card per slide; pano posts render CardPano once per slide as a window
// (panel i) onto one wide canvas, so the slides join up when swiped.
// usage: node remotion/render.mjs <post.json> <outDir>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const here = path.dirname(fileURLToPath(import.meta.url));
const [postPath, outDir] = process.argv.slice(2);
if (!postPath || !outDir) throw new Error("usage: node remotion/render.mjs <post.json> <outDir>");
const post = JSON.parse(fs.readFileSync(postPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.tsx") });
const total = post.slides.length;
for (const [i, slide] of post.slides.entries()) {
  const pano = post.design === "pano";
  const id = pano ? "CardPano" : "Card";
  const inputProps = pano
    ? { slides: post.slides, panel: i, handle: post.handle ?? "@citygym_geumho", topic: post.label ?? "" }
    : { slide, idx: i + 1, total };
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const n = String(i + 1).padStart(2, "0");
  await renderMedia({ composition, serveUrl, codec: "h264", inputProps, outputLocation: path.join(outDir, `${n}.mp4`), crf: 23 });
  await renderStill({ composition, serveUrl, inputProps, frame: 120, imageFormat: "jpeg", output: path.join(outDir, `${n}.jpg`) });
  console.log(path.join(outDir, `${n}.mp4`));
}
