"""Render a card-news post (data/posts/<id>.json) into 1080x1350 JPEG slides.

Slide copy may use ==text== for the accent colour, ??text?? for a redacted word (hidden
behind a bar, revealed on a later slide) and a newline for a line break.
Type sizes are set for a phone feed (a 1080px card shows at about 36% size), so the
smallest text on a card is 34px and headlines start at 100px.

Posts render as motion by default ("format": "motion"): each slide becomes a 5-second
1080x1350 MP4 whose elements animate in, plus a JPEG of the last frame for previews.
"format": "static" renders JPEGs only.
"""

import base64
import functools
import html
import json
import mimetypes
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / "fonts"
MEDIA = ROOT / "media"
HANDLE = "@citygym_geumho"
W, H = 1080, 1350
ACCENT = "#2F6BFF"  # CITYGYM logo blue
FPS = 30
SECONDS = 5  # per slide; Instagram carousel videos must be 3-60s

THEMES = {
    # bg, ink, sub, line
    "dark": ("#0E1116", "#FFFFFF", "#A4ACBA", "#262B35"),
    "light": ("#F2F3F5", "#0E1116", "#59606E", "#D9DCE2"),
}


def fmt(text):
    """Escape, then turn ==x== into accent spans, ??x?? into redaction bars, \n into <br>."""
    out = html.escape(text or "")
    out = re.sub(r"\?\?(.+?)\?\?", r'<span class="rd">\1</span>', out)
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


def fmt_lines(text):
    """Like fmt, but wraps each line so motion can reveal headlines line by line."""
    lines = fmt(text).split("<br>")
    return "".join(
        f'<span class="ln"><span style="--i:{i}">{line}</span></span>' for i, line in enumerate(lines)
    )


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
        <div class="cover{' with-photo' if photo else ''}{' boxed' if s.get('style') == 'boxed' else ''}">
          {kicker}
          <h1 data-max="{300 if photo else 520}">{fmt_lines(s['title'])}</h1>
          <p class="sub">{fmt(s.get('sub'))}</p>
        </div>"""
    if kind == "list":
        items = "".join(
            f'<li style="--i:{i}"><span class="n">{i}</span><span>{fmt(t)}</span></li>'
            for i, t in enumerate(s["items"], 1)
        )
        return f"""
        <div class="mid{' dense' if len(s['items']) > 5 else ''}">
          {kicker or '<div class="kicker">캡처해두세요</div>'}
          <h2 data-max="240">{fmt_lines(s['title'])}</h2>
          <ol>{items}</ol>
        </div>"""
    if kind == "cta":
        return f"""
        <div class="mid cta">
          {kicker}
          <h2 data-max="380">{fmt_lines(s['title'])}</h2>
          <p class="body">{fmt(s.get('body'))}</p>
          <div class="place">시티짐 금호점 · 금호역 1번 출구 앞</div>
        </div>"""
    if kind == "compare":
        return f"""
        <div class="mid">
          {kicker}
          <h2 data-max="250">{fmt_lines(s['title'])}</h2>
          <div class="vs">
            <div class="side bad"><span class="mark">✕</span><span>{fmt(s['wrong'])}</span></div>
            <div class="side good"><span class="mark">○</span><span>{fmt(s['right'])}</span></div>
          </div>
          <p class="body">{fmt(s.get('body'))}</p>
        </div>"""
    if kind == "quiz":
        opts = "".join(
            f'<div class="opt" style="--i:{i}"><span class="n">{chr(65 + i)}</span><span>{fmt(o)}</span></div>'
            for i, o in enumerate(s["options"])
        )
        return f"""
        <div class="mid quiz">
          {kicker or '<div class="kicker">맞혀보세요</div>'}
          <h2 data-max="250">{fmt_lines(s['title'])}</h2>
          <div class="opts">{opts}</div>
        </div>"""
    # point
    no = f'<div class="no">{html.escape(s["no"])}</div>' if s.get("no") else ""
    photo = _img(s, "inset")
    return f"""
        <div class="mid{' boxed' if s.get('style') == 'boxed' else ''}">
          {photo}{no or kicker}
          <h2 data-max="{250 if photo else 360}">{fmt_lines(s['title'])}</h2>
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
.rd{display:inline-block;white-space:nowrap;color:transparent;background:var(--ink);border-radius:.12em;padding:0 .1em;
  -webkit-text-fill-color:transparent;position:relative}
.opts{margin-top:52px;display:flex;flex-direction:column;gap:28px}
.opt{display:flex;align-items:center;gap:30px;font-size:54px;font-weight:800;line-height:1.25;
  padding:30px 34px;border:4px solid var(--line);border-radius:24px}
.opt .n{flex:none;width:76px;height:76px;border-radius:50%%;background:%(A)s;color:#fff;font-size:42px;
  font-weight:900;display:flex;align-items:center;justify-content:center}
.boxed .ln{margin-bottom:.12em}
.boxed .ln>span{background:%(A)s;color:#fff;padding:0 .14em;border-radius:.06em}
.boxed .mk{color:#fff}
.series{position:absolute;top:52px;left:96px;z-index:3;font-size:30px;font-weight:900;letter-spacing:.04em;
  color:var(--ink)}
.series .mk{color:%(A)s}
.dense ol{margin-top:30px}
.dense li{font-size:42px;padding:16px 0;gap:24px}
.dense li .n{width:58px;height:58px;font-size:30px}
.vs{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:52px}
.side{border-radius:28px;padding:40px 34px;font-size:48px;font-weight:800;line-height:1.3;
  display:flex;flex-direction:column;gap:22px;border:4px solid var(--line)}
.side .mark{font-size:96px;font-weight:900;line-height:1}
.bad .mark{color:#FF4D4F}
.good{border-color:%(A)s}
.good .mark{color:%(A)s}
.ln{display:block}
.ln>span{display:inline-block}
""" % {"W": W, "H": H, "A": ACCENT}

# Motion layer: only active with body.motion. Every animation ends in the static layout, so
# the last frame matches the JPEG design. Timeline: badge 0.1s, headline lines from 0.25s,
# accent word 0.9s, body 1.0s, list rows from 0.7s, teaser 1.6s then a looping nudge.
MOTION_CSS = """
.motion{--e:cubic-bezier(.16,1,.3,1)}
.motion .glow{position:absolute;width:900px;height:900px;border-radius:50%%;left:-200px;top:-150px;
  background:radial-gradient(circle,%(A)s55,transparent 65%%);opacity:.35;
  animation:drift 5s ease-in-out infinite alternate}
.motion.light .glow{opacity:.18}
.motion .cover,.motion .mid{position:relative;z-index:1}
.motion .page,.motion .foot{animation:fade .5s var(--e) both}
.motion .kicker{animation:slideIn .6s var(--e) .1s both}
.motion .no{animation:pop .7s var(--e) .1s both;transform-origin:left bottom}
.motion .ln{overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
.motion .ln>span{animation:up .8s var(--e) both;animation-delay:calc(.25s + var(--i) * .12s)}
.motion .mk{position:relative;animation:ink .4s ease-out .9s both}
.motion h1 .mk::after,.motion h2 .mk::after{content:"";position:absolute;left:0;right:0;bottom:.04em;
  height:.09em;background:%(A)s;border-radius:.05em;transform-origin:left;animation:bar .5s var(--e) 1s both}
.motion .sub,.motion .body{animation:fadeUp .7s var(--e) 1s both}
.motion li{animation:slideIn .6s var(--e) both;animation-delay:calc(.55s + var(--i) * .15s)}
.motion li .n{animation:pop .5s var(--e) both;animation-delay:calc(.65s + var(--i) * .15s)}
.motion .place{animation:fadeUp .7s var(--e) 1.4s both}
.motion .photo{animation:zoom 5s linear both;transform-origin:center 30%%}
.motion .inset{animation:fadeUp .8s var(--e) both}
.motion .next{animation:fadeUp .6s var(--e) 1.6s both,nudge 1.2s ease-in-out 2.2s infinite}
.motion .rd{animation:bar .45s var(--e) .95s both,blink 1.6s ease-in-out 1.6s infinite;transform-origin:left}
.motion .bad{animation:pop .6s var(--e) .8s both}
.motion .good{animation:pop .6s var(--e) 1.1s both}
.motion .series{animation:fade .5s var(--e) both}
.motion .opt{animation:pop .6s var(--e) both;animation-delay:calc(.8s + var(--i) * .18s);transform-origin:left center}
@keyframes fade{from{opacity:0}}
@keyframes up{from{transform:translateY(110%%)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(40px)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-60px)}}
@keyframes pop{0%%{opacity:0;transform:scale(.3)}70%%{opacity:1;transform:scale(1.08)}}
@keyframes bar{from{transform:scaleX(0)}}
@keyframes ink{from{color:var(--ink)}}
@keyframes nudge{50%%{transform:translateX(-14px)}}
@keyframes zoom{to{transform:scale(1.08)}}
@keyframes drift{to{transform:translate(420px,520px) scale(1.2)}}
@keyframes blink{50%%{opacity:.55}}
""" % {"A": ACCENT}

SEEK_JS = "t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; })"

# Shrink any headline that is taller than its data-max budget, so a long title from the
# drafting step never runs into the teaser or footer.
FIT_JS = """
for (const h of document.querySelectorAll('[data-max]')) {
  let size = parseFloat(getComputedStyle(h).fontSize);
  while (h.offsetHeight > +h.dataset.max && size > 60) { size -= 4; h.style.fontSize = size + 'px'; }
}
"""


def slide_html(s, idx, total, theme, motion=False, series=""):
    bg, ink, sub, line = THEMES[theme]
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{_font_faces()}
:root{{--bg:{bg};--ink:{ink};--sub:{sub};--line:{line}}}
{CSS}{MOTION_CSS if motion else ""}</style></head><body class="{theme}{' motion' if motion else ''}"><div class="card">
{'<div class="glow"></div>' if motion else ''}
{f'<div class="series">{fmt(series)}</div>' if series else ''}
<div class="page">{idx} / {total}</div>
{_slide_body(s)}
{_teaser(s, idx, total)}
<div class="foot"><span>{HANDLE}</span><b>CITYGYM</b></div>
</div></body></html>"""


def _encode(page, path):
    """Seek every animation frame by frame and pipe the screenshots into ffmpeg."""
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
         "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
         "-map", "0:v", "-map", "1:a", "-shortest",
         "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
         "-profile:v", "high", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", str(path)],
        stdin=subprocess.PIPE,
    )
    for f in range(FPS * SECONDS):
        page.evaluate(SEEK_JS, f * 1000 / FPS)
        ff.stdin.write(page.screenshot(type="jpeg", quality=95))
    ff.stdin.close()
    if ff.wait():
        raise RuntimeError(f"ffmpeg failed for {path}")


def is_motion(post):
    return post.get("format", "motion") == "motion"


def render_post(post, out_dir=None):
    """Render all slides of a post dict. Returns the media paths (MP4 for motion, else JPEG)."""
    from playwright.sync_api import sync_playwright

    slides = post["slides"]
    theme = post.get("theme", "dark")
    motion = is_motion(post)
    out_dir = Path(out_dir or MEDIA / post["id"])
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for i, s in enumerate(slides, 1):
            page.set_content(slide_html(s, i, len(slides), s.get("theme") or theme, motion, post.get("series", "")), wait_until="load")
            page.evaluate("document.fonts.ready")
            page.evaluate(FIT_JS)
            jpg = out_dir / f"{i:02d}.jpg"
            if motion:
                mp4 = out_dir / f"{i:02d}.mp4"
                _encode(page, mp4)
                page.evaluate(SEEK_JS, SECONDS * 1000)  # last frame = finished layout
                paths.append(mp4)
            else:
                paths.append(jpg)
            page.screenshot(path=str(jpg), type="jpeg", quality=92)
        browser.close()
    return paths


if __name__ == "__main__":
    import sys

    post = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for p in render_post(post, sys.argv[2] if len(sys.argv) > 2 else None):
        print(p)
