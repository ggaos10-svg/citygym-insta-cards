"""Render a card-news post (data/posts/<id>.json) into 1080x1350 JPEG slides.

Slide copy may use ==text== for the accent colour and a newline for a line break.
Type sizes are set for a phone feed (a 1080px card shows at about 36% size), so the
smallest text on a card is 34px and headlines start at 100px.
"""

import base64
import functools
import html
import json
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / "fonts"
MEDIA = ROOT / "media"
HANDLE = "@citygym_geumho"
W, H = 1080, 1350
ACCENT = "#2F6BFF"  # CITYGYM logo blue

THEMES = {
    # bg, ink, sub, line
    "dark": ("#0E1116", "#FFFFFF", "#A4ACBA", "#262B35"),
    "light": ("#F2F3F5", "#0E1116", "#59606E", "#D9DCE2"),
}


def fmt(text):
    """Escape, then turn ==x== into accent spans and newlines into <br>."""
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


def _image_src(ref):
    """`image` may be an https URL or a path relative to the repo root (e.g. assets/x.jpg)."""
    if not ref or ref.startswith(("http://", "https://", "data:")):
        return ref
    path = ROOT / ref
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def _img(s, cls):
    src = _image_src(s.get("image"))
    if not src:
        return ""
    pos = html.escape(s.get("image_pos", "center"))
    return f'<div class="{cls}" style="background-image:url(\'{src}\');background-position:{pos}"></div>'


def _slide_body(s):
    kind = s.get("type", "point")
    kicker = f'<div class="kicker">{fmt(s["kicker"])}</div>' if s.get("kicker") else ""
    if kind == "cover":
        photo = _img(s, "photo")
        return f"""
        {photo}
        <div class="cover{' with-photo' if photo else ''}">
          {kicker}
          <h1 data-max="{300 if photo else 520}">{fmt(s['title'])}</h1>
          <p class="sub">{fmt(s.get('sub'))}</p>
        </div>"""
    if kind == "list":
        items = "".join(
            f'<li><span class="n">{i}</span><span>{fmt(t)}</span></li>'
            for i, t in enumerate(s["items"], 1)
        )
        return f"""
        <div class="mid">
          {kicker or '<div class="kicker">캡처해두세요</div>'}
          <h2 data-max="240">{fmt(s['title'])}</h2>
          <ol>{items}</ol>
        </div>"""
    if kind == "cta":
        return f"""
        <div class="mid cta">
          {kicker}
          <h2 data-max="380">{fmt(s['title'])}</h2>
          <p class="body">{fmt(s.get('body'))}</p>
          <div class="place">시티짐 금호점 · 금호역 1번 출구 앞</div>
        </div>"""
    # point
    no = f'<div class="no">{html.escape(s["no"])}</div>' if s.get("no") else ""
    photo = _img(s, "inset")
    return f"""
        <div class="mid">
          {photo}{no or kicker}
          <h2 data-max="{250 if photo else 360}">{fmt(s['title'])}</h2>
          <p class="body">{fmt(s.get('body'))}</p>
        </div>"""


def _teaser(s, idx, total):
    """Bottom hook that pulls the reader to the next slide."""
    if idx == total:
        return ""
    text = s.get("next") or ("넘겨서 확인 →" if idx == 1 else "")
    return f'<div class="next">{fmt(text)}</div>' if text else ""


CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{width:%(W)dpx;height:%(H)dpx;background:var(--bg);color:var(--ink);font-family:P,sans-serif;
  word-break:keep-all;overflow:hidden}
.card{position:relative;width:%(W)dpx;height:%(H)dpx;padding:110px 96px 190px;display:flex;flex-direction:column}
.page{position:absolute;top:44px;right:56px;z-index:3;font-size:30px;font-weight:800;color:#fff;
  background:rgba(14,17,22,.55);padding:8px 20px;border-radius:40px;letter-spacing:.02em}
.light .page{background:rgba(14,17,22,.08);color:var(--sub)}
.foot{position:absolute;bottom:56px;left:96px;right:96px;display:flex;justify-content:space-between;
  align-items:center;font-size:30px;font-weight:600;color:var(--sub)}
.foot b{font-weight:900;color:var(--ink);letter-spacing:.06em}
.mk{color:%(A)s}
.kicker{align-self:flex-start;font-size:36px;font-weight:800;color:#fff;background:%(A)s;
  padding:12px 26px;border-radius:12px;margin-bottom:36px}
.photo{position:absolute;top:0;left:0;right:0;height:600px;background-size:cover}
.photo::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 62%%,var(--bg))}
.cover{position:relative;z-index:2;margin:auto 0;display:flex;flex-direction:column}
.cover.with-photo{margin:0;padding-top:440px}
h1{font-size:150px;line-height:1.1;font-weight:900;letter-spacing:-.04em}
.with-photo h1{font-size:128px}
.sub{margin-top:36px;font-size:46px;line-height:1.4;font-weight:600;color:var(--sub)}
.sub:empty,.body:empty{display:none}
.next{position:absolute;left:96px;right:96px;bottom:128px;font-size:40px;line-height:1.3;
  font-weight:800;color:%(A)s;text-align:right}
.mid{margin:auto 0;display:flex;flex-direction:column}
.inset{height:400px;border-radius:28px;background-size:cover;margin-bottom:48px}
.no{font-size:120px;font-weight:900;line-height:1;color:%(A)s;margin-bottom:28px;letter-spacing:-.04em}
h2{font-size:104px;line-height:1.16;font-weight:900;letter-spacing:-.035em}
.body{margin-top:44px;font-size:50px;line-height:1.5;font-weight:600;color:var(--sub)}
ol{list-style:none;margin-top:44px}
li{display:flex;align-items:center;gap:30px;font-size:54px;line-height:1.3;font-weight:800;padding:26px 0;
  border-bottom:3px solid var(--line)}
li .n{flex:none;width:72px;height:72px;border-radius:50%%;background:%(A)s;color:#fff;
  font-size:38px;display:flex;align-items:center;justify-content:center}
.cta h2{font-size:108px}
.place{margin-top:56px;font-size:40px;font-weight:800;border:4px solid var(--ink);padding:22px 30px;
  border-radius:16px;align-self:flex-start}
""" % {"W": W, "H": H, "A": ACCENT}

# Shrink any headline that is taller than its data-max budget, so a long title from the
# drafting step never runs into the teaser or footer.
FIT_JS = """
for (const h of document.querySelectorAll('[data-max]')) {
  let size = parseFloat(getComputedStyle(h).fontSize);
  while (h.offsetHeight > +h.dataset.max && size > 60) { size -= 4; h.style.fontSize = size + 'px'; }
}
"""


def slide_html(s, idx, total, theme):
    bg, ink, sub, line = THEMES[theme]
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{_font_faces()}
:root{{--bg:{bg};--ink:{ink};--sub:{sub};--line:{line}}}
{CSS}</style></head><body class="{theme}"><div class="card">
<div class="page">{idx} / {total}</div>
{_slide_body(s)}
{_teaser(s, idx, total)}
<div class="foot"><span>{HANDLE}</span><b>CITYGYM</b></div>
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
            page.set_content(slide_html(s, i, len(slides), s.get("theme") or theme), wait_until="load")
            page.evaluate("document.fonts.ready")
            page.evaluate(FIT_JS)
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
