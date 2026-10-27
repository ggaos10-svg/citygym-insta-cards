"""Render a card-news post with the Remotion renderer in remotion/ (Note or pano design, see
cards/config/design.md): one 8-second 1080x1350 MP4 per slide plus a JPEG preview, a
fingerprint of what was rendered, and review.jpg (every slide at phone size, for REVIEW.md)."""

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
REMOTION = ROOT / "remotion"
# prop names the renderer can draw: the keys of CODE_PROPS in remotion/src/art/Art.tsx
_ART = (REMOTION / "src" / "art" / "Art.tsx").read_text(encoding="utf-8")
PROPS = set(re.findall(r"^  (\w+): ", _ART.split("export const CODE_PROPS", 1)[1], re.M))


REVIEW_TIMES = (0.4, 1.2, 4.0)  # seconds: first impression, text done, cover frame


def fingerprint(post):
    """Changes whenever something that shows on the slides changes, so edits get re-rendered."""
    keys = ("design", "slides", "label", "handle")
    return hashlib.sha1(json.dumps({k: post.get(k) for k in keys}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def review_sheet(out, n):
    """review.jpg: one row per moment in REVIEW_TIMES, one column per slide, each slide 390 px
    wide (about what a phone shows), so text size can be judged as a reader would see it."""
    if not shutil.which("ffmpeg"):
        return
    inputs, cells = [], []
    for t in REVIEW_TIMES:
        for i in range(1, n + 1):
            inputs += ["-ss", str(t), "-i", str(out / f"{i:02d}.mp4")]
    k = 0
    rows = []
    for r in range(len(REVIEW_TIMES)):
        for c in range(n):
            cells.append(f"[{k}:v]trim=end_frame=1,scale=390:-1,pad=iw+6:ih+6:3:3:white[c{k}]")
            k += 1
        rows.append("".join(f"[c{r * n + c}]" for c in range(n)) + f"hstack={n}[r{r}]" if n > 1 else f"[c{r * n}]copy[r{r}]")
    graph = ";".join(cells + rows) + ";" + "".join(f"[r{r}]" for r in range(len(REVIEW_TIMES))) + f"vstack={len(REVIEW_TIMES)}"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-frames:v", "1",
                    "-q:v", "4", str(out / "review.jpg")], check=True)


def render_post(post, post_path, out_dir=None):
    """Render all slides of the post stored at post_path. Returns the MP4 paths."""
    out = Path(out_dir or MEDIA / post["id"])
    subprocess.run(["node", str(REMOTION / "render.mjs"), str(post_path), str(out)], check=True)
    for extra in out.glob("*.mp4"):  # drop slides left over from a longer earlier version
        if int(extra.stem) > len(post["slides"]):
            extra.unlink()
            extra.with_suffix(".jpg").unlink(missing_ok=True)
    review_sheet(out, len(post["slides"]))
    (out / "source.sha1").write_text(fingerprint(post) + "\n", encoding="utf-8")
    return sorted(out.glob("*.mp4"))
