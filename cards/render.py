"""Render a card-news post with the Remotion renderer in remotion/ (Note design, see
cards/config/design.md): one 8-second 1080x1350 MP4 per slide plus a JPEG preview."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
REMOTION = ROOT / "remotion"
# prop names the renderer can draw: the keys of CODE_PROPS in remotion/src/art/Art.tsx
_ART = (REMOTION / "src" / "art" / "Art.tsx").read_text(encoding="utf-8")
PROPS = set(re.findall(r"^  (\w+): ", _ART.split("export const CODE_PROPS", 1)[1], re.M))


def render_post(post, post_path, out_dir=None):
    """Render all slides of the post stored at post_path. Returns the MP4 paths."""
    out = Path(out_dir or MEDIA / post["id"])
    subprocess.run(["node", str(REMOTION / "render.mjs"), str(post_path), str(out)], check=True)
    return sorted(out.glob("*.mp4"))
