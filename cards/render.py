"""Render a card-news post (data/posts/<id>.json) into 1080x1350 JPEG slides.

Slide copy may use ==text== for the yellow highlighter and a newline for a line break.
"""

import base64
import functools
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / "fonts"
MEDIA = ROOT / "media"
HANDLE = "@citygym_geumho"
W, H = 1080, 1350

THEMES = {
    # bg, ink, sub, line, mark (highlighter)
    "dark": ("#161616", "#F4F2EC", "#A9A69E", "#2E2D2A", "#F5E43A"),
    "light": ("#ECEAE4", "#141414", "#5E5B55", "#D3D0C8", "#F5E43A"),
}


def fmt(text):
    """Escape, then turn ==x== into highlighter spans and newlines into <br>."""
    out = html.escape(text or "")
    out = re.sub(r"==(.+?)==", r'<span class="mk">\1</span>', out)
    return out.replace("\n", "<br>")


@functools.cache
def _font_faces():
    # Inlined as data URIs: pages loaded with set_content cannot read file:// fonts.
    faces = []
    for name, weight in (("Regular", 400), ("SemiBold", 600), ("ExtraBold", 800), ("Black", 900)):
        data = base64.b64encode((FONTS / f"Pretendard-{name}.woff2").read_bytes()).decode()
        url = f"data:font/woff2;base64,{data}"
        faces.append(
            f"@font-face{{font-family:P;font-weight:{weight};src:url('{url}') format('woff2')}}"
        )
    return "\n".join(faces)


def _slide_body(s):
    kind = s.get("type", "point")
    if kind == "cover":
        return f"""
        <div class="cover">
          <div class="kicker">{fmt(s.get('kicker'))}</div>
          <h1>{fmt(s['title'])}</h1>
          <p class="sub">{fmt(s.get('sub'))}</p>
        </div>
"""
    if kind == "list":
        items = "".join(
            f'<li><span class="n">{i:02d}</span><span>{fmt(t)}</span></li>'
            for i, t in enumerate(s["items"], 1)
        )
        return f"""
        <div class="mid">
          <div class="kicker">{fmt(s.get('kicker') or '한 장 요약')}</div>
          <h2>{fmt(s['title'])}</h2>
          <ol>{items}</ol>
        </div>"""
    if kind == "cta":
        return f"""
        <div class="mid cta">
          <h2>{fmt(s['title'])}</h2>
          <p class="body">{fmt(s.get('body'))}</p>
          <div class="place">시티짐 금호점 · 금호역 1번 출구 앞</div>
        </div>"""
    # point
    no = s.get("no", "")
    return f"""
        <div class="mid">
          <div class="no">{html.escape(no)}</div>
          <h2>{fmt(s['title'])}</h2>
          <p class="body">{fmt(s.get('body'))}</p>
        </div>"""


def _teaser(s, idx, total):
    """Bottom-right hook that pulls the reader to the next slide."""
    if idx == total:
        return ""
    text = s.get("next") or ("넘겨서 확인 →" if idx == 1 else "")
    return f'<div class="next">{fmt(text)}</div>' if text else ""


CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{width:%(W)dpx;height:%(H)dpx;background:var(--bg);color:var(--ink);font-family:P,sans-serif;
  word-break:keep-all;overflow:hidden}
.card{position:relative;width:%(W)dpx;height:%(H)dpx;padding:120px 112px;display:flex;flex-direction:column}
.card::before{content:"";position:absolute;inset:0;opacity:.06;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='100%%' height='100%%' filter='url(%%23n)'/></svg>")}
.top{position:absolute;top:56px;left:112px;right:112px;display:flex;justify-content:space-between;
  font-size:26px;font-weight:600;letter-spacing:.08em;color:var(--sub)}
.top b{color:var(--ink);font-weight:900}
.foot{position:absolute;bottom:52px;left:112px;right:112px;display:flex;justify-content:space-between;
  font-size:26px;font-weight:600;color:var(--sub);border-top:2px solid var(--line);padding-top:22px}
.mk{background:linear-gradient(transparent 58%%,var(--mark) 58%%,var(--mark) 92%%,transparent 92%%);
  color:inherit;padding:0 .08em}
.dark .mk{background:none;color:var(--mark);padding:0}
.kicker{display:inline-block;font-size:32px;font-weight:800;color:var(--bg);background:var(--ink);
  padding:10px 22px;margin-bottom:40px;align-self:flex-start}
.cover{margin-top:auto;margin-bottom:auto;display:flex;flex-direction:column}
h1{font-size:118px;line-height:1.14;font-weight:900;letter-spacing:-.035em}
.sub{margin-top:44px;font-size:40px;line-height:1.45;font-weight:600;color:var(--sub)}
.next{position:absolute;right:112px;bottom:128px;max-width:760px;text-align:right;font-size:34px;line-height:1.35;font-weight:800;color:var(--ink)}
.mid{margin:auto 0;display:flex;flex-direction:column}
.no{font-size:150px;font-weight:900;line-height:1;color:var(--mark);margin-bottom:36px;letter-spacing:-.04em}
.light .no{color:var(--ink)}
h2{font-size:82px;line-height:1.2;font-weight:900;letter-spacing:-.03em}
.body{margin-top:48px;font-size:42px;line-height:1.6;font-weight:400;color:var(--ink);opacity:.86}
ol{list-style:none;margin-top:48px;border-top:3px solid var(--ink)}
li{display:flex;gap:28px;font-size:40px;line-height:1.4;font-weight:600;padding:26px 0;border-bottom:2px solid var(--line)}
li .n{font-weight:900;color:var(--sub);min-width:56px}
.cta h2{font-size:92px}
.place{margin-top:64px;font-size:34px;font-weight:800;border:3px solid var(--ink);padding:20px 28px;align-self:flex-start}
""" % {"W": W, "H": H}


def slide_html(s, idx, total, theme):
    bg, ink, sub, line, mark = THEMES[theme]
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{_font_faces()}
:root{{--bg:{bg};--ink:{ink};--sub:{sub};--line:{line};--mark:{mark}}}
{CSS}</style></head><body class="{theme}"><div class="card">
<div class="top"><span><b>CITYGYM</b> 금호점</span><span>{idx}/{total}</span></div>
{_slide_body(s)}
{_teaser(s, idx, total)}
<div class="foot"><span>{HANDLE}</span><span>금호역 헬스장</span></div>
</div></body></html>"""


def render_post(post, out_dir=None):
    """Render all slides of a post dict. Returns the list of JPEG paths."""
    from playwright.sync_api import sync_playwright

    slides = post["slides"]
    theme = post.get("theme", "dark")
    out_dir = Path(out_dir or MEDIA / post["id"])
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for i, s in enumerate(slides, 1):
            # Alternate themes on inner slides so the swipe feels like a turn of page.
            t = s.get("theme") or theme
            page.set_content(slide_html(s, i, len(slides), t), wait_until="load")
            page.evaluate("document.fonts.ready.then(() => document.fonts.check('900 40px P'))")
            path = out_dir / f"{i:02d}.jpg"
            page.screenshot(path=str(path), type="jpeg", quality=92)
            paths.append(path)
        browser.close()
    return paths


if __name__ == "__main__":
    import sys

    post = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for p in render_post(post, sys.argv[2] if len(sys.argv) > 2 else None):
        print(p)
